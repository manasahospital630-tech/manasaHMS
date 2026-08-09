"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveEmergencyPatients = exports.updateEmergencyOrderStatus = exports.getEmergencyOrders = exports.createEmergencyOrder = exports.updateEmergencyStatus = exports.getEmergencyVitalsHistory = exports.logEmergencyVitals = exports.saveDigitalConsent = exports.getEmergencyConsents = exports.generatePoliceIntimation = exports.checkAndTriggerPoliceIntimation = exports.admitEmergencyPatient = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const uuid_1 = require("uuid");
const mrnGenerator_1 = require("../../utils/mrnGenerator");
const admitEmergencyPatient = async (input) => {
    await (0, database_1.query)('BEGIN');
    try {
        let bedId = input.currentBedId || null;
        if (bedId) {
            const bedRes = await (0, database_1.query)('SELECT status FROM hospital_beds WHERE bed_id = $1 FOR UPDATE', [bedId]);
            if (bedRes.rows.length === 0 || bedRes.rows[0].status !== 'Available') {
                throw new errorHandler_1.AppError('Selected bed is not available', 400);
            }
            // Mark bed occupied
            await (0, database_1.query)("UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1", [bedId]);
        }
        const trackingId = `EMG-${Date.now().toString().slice(-6)}`;
        let nameToSave = input.patientName || '';
        if (input.isUnknown) {
            nameToSave = `UNKNOWN-${input.gender}-${trackingId}`;
        }
        const nameParts = nameToSave.split(' ');
        const firstName = nameParts[0] || 'Emergency';
        const lastName = nameParts.slice(1).join(' ') || 'Patient';
        const patientId = (0, uuid_1.v4)();
        const mrn = await (0, mrnGenerator_1.generateMRN)();
        // Create patient record
        await (0, database_1.query)(`
      INSERT INTO patients (patient_id, mrn, first_name, last_name, gender, date_of_birth, is_inpatient)
      VALUES ($1, $2, $3, $4, $5, '1900-01-01', TRUE)
    `, [patientId, mrn, firstName, lastName, input.gender]);
        const emergencyId = (0, uuid_1.v4)();
        // Create admission
        await (0, database_1.query)(`
      INSERT INTO emergency_admissions (
        emergency_id, emergency_tracking_id, patient_id, is_unknown, estimated_age, physical_marks,
        belongings_inventory, is_mlc, mlc_category, triage_priority,
        brought_by_name, brought_by_phone, brought_by_relation,
        police_badge_number, police_station, police_officer_name,
        current_bed_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'IN_ER_CARE')
    `, [
            emergencyId,
            trackingId,
            patientId,
            input.isUnknown || false,
            input.estimatedAge || null,
            input.physicalMarks || null,
            input.belongingsInventory || null,
            input.isMLC || false,
            input.mlcCategory || null,
            input.triagePriority || 'RED',
            input.broughtBy?.name || null,
            input.broughtBy?.phone || null,
            input.broughtBy?.relation || null,
            input.broughtBy?.policeBadgeNumber || null,
            input.broughtBy?.policeStation || null,
            input.broughtBy?.policeOfficerName || null,
            bedId
        ]);
        const emgRes = await (0, database_1.query)('SELECT * FROM emergency_admissions WHERE emergency_id = $1', [emergencyId]);
        const emergencyRecord = emgRes.rows[0];
        // Create general EMR encounter so SOAP notes can be appended
        const encounterId = (0, uuid_1.v4)();
        await (0, database_1.query)(`
      INSERT INTO encounters (encounter_id, patient_id, provider_id, chief_complaint, status)
      VALUES ($1, $2, $3, $4, 'Active')
    `, [encounterId, patientId, input.admittingDoctorId || null, `Emergency Admission: ${input.mlcCategory || 'General trauma'}`]);
        await (0, database_1.query)('COMMIT');
        // Trigger police intimation check
        const policeNotice = (0, exports.checkAndTriggerPoliceIntimation)(emergencyRecord);
        return {
            emergencyRecord,
            policeNotice
        };
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.admitEmergencyPatient = admitEmergencyPatient;
const checkAndTriggerPoliceIntimation = (emergencyRecord) => {
    const mlcCategoriesRequiringPolice = ['ACCIDENT', 'RTA', 'SUICIDE_ATTEMPT', 'ASSAULT', 'GUNSHOT', 'POISONING'];
    const isMlc = emergencyRecord.is_mlc || (emergencyRecord.mlc_category && emergencyRecord.mlc_category !== 'null');
    const category = emergencyRecord.mlc_category || '';
    if (isMlc && mlcCategoriesRequiringPolice.includes(category.toUpperCase())) {
        return {
            requiresImmediatePoliceNotice: true,
            noticeSubject: `MLC INTIMATION: ${category.toUpperCase()} - ${emergencyRecord.emergency_tracking_id}`,
            templateData: {
                timeOfArrival: new Date().toISOString(),
                broughtBy: emergencyRecord.brought_by_name || 'Ambulance Staff',
                provisionalDiagnosis: 'Emergency evaluation in progress'
            }
        };
    }
    return { requiresImmediatePoliceNotice: false };
};
exports.checkAndTriggerPoliceIntimation = checkAndTriggerPoliceIntimation;
const generatePoliceIntimation = async (emergencyId, officerDetails) => {
    const recordRes = await (0, database_1.query)('SELECT * FROM emergency_admissions WHERE emergency_id = $1', [emergencyId]);
    if (recordRes.rows.length === 0) {
        throw new errorHandler_1.AppError('Emergency record not found', 404);
    }
    // Update police officer details on the record
    await (0, database_1.query)(`
    UPDATE emergency_admissions 
    SET police_officer_name = $1, police_badge_number = $2, police_station = $3, police_informed = TRUE
    WHERE emergency_id = $4
  `, [officerDetails.officerName, officerDetails.badgeNumber, officerDetails.policeStation, emergencyId]);
    return {
        success: true,
        message: 'Police intimation details logged successfully.'
    };
};
exports.generatePoliceIntimation = generatePoliceIntimation;
const getEmergencyConsents = async (emergencyId) => {
    const consentsRes = await (0, database_1.query)('SELECT * FROM emergency_consents WHERE emergency_id = $1', [emergencyId]);
    return consentsRes.rows;
};
exports.getEmergencyConsents = getEmergencyConsents;
const saveDigitalConsent = async (input) => {
    const consentId = (0, uuid_1.v4)();
    await (0, database_1.query)(`
    INSERT INTO emergency_consents (consent_id, emergency_id, consent_type, signatory_name, relation, signature_data_url)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [consentId, input.emergencyId, input.consentType, input.signatoryName, input.relation || null, input.signatureDataUrl]);
    const res = await (0, database_1.query)('SELECT * FROM emergency_consents WHERE consent_id = $1', [consentId]);
    return res.rows[0];
};
exports.saveDigitalConsent = saveDigitalConsent;
const logEmergencyVitals = async (input) => {
    const logId = (0, uuid_1.v4)();
    await (0, database_1.query)(`
    INSERT INTO emergency_vitals_log (log_id, emergency_id, bp_sys, bp_dia, pulse, spo2, respiratory_rate, gcs_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
        logId,
        input.emergencyId,
        input.bpSys || null,
        input.bpDia || null,
        input.pulse || null,
        input.spo2 || null,
        input.respiratoryRate || null,
        input.gcsScore || null
    ]);
    const res = await (0, database_1.query)('SELECT * FROM emergency_vitals_log WHERE log_id = $1', [logId]);
    return res.rows[0];
};
exports.logEmergencyVitals = logEmergencyVitals;
const getEmergencyVitalsHistory = async (emergencyId) => {
    const res = await (0, database_1.query)('SELECT * FROM emergency_vitals_log WHERE emergency_id = $1 ORDER BY logged_at DESC', [emergencyId]);
    return res.rows;
};
exports.getEmergencyVitalsHistory = getEmergencyVitalsHistory;
const updateEmergencyStatus = async (input) => {
    await (0, database_1.query)('BEGIN');
    try {
        const recordRes = await (0, database_1.query)('SELECT * FROM emergency_admissions WHERE emergency_id = $1', [input.emergencyId]);
        if (recordRes.rows.length === 0) {
            throw new errorHandler_1.AppError('Emergency record not found', 404);
        }
        const record = recordRes.rows[0];
        // If changing from ER to transferred/discharged, free original bed
        if (record.current_bed_id && record.status === 'IN_ER_CARE' && input.status !== 'IN_ER_CARE') {
            await (0, database_1.query)("UPDATE hospital_beds SET status = 'Available' WHERE bed_id = $1", [record.current_bed_id]);
        }
        // Update emergency admission status
        await (0, database_1.query)(`
      UPDATE emergency_admissions
      SET status = $1, current_bed_id = $2, discharged_at = $3
      WHERE emergency_id = $4
    `, [
            input.status,
            input.currentBedId || null,
            (input.status === 'DISCHARGED' || input.status === 'MORTUARY') ? new Date() : null,
            input.emergencyId
        ]);
        // If transferred to IP, allocate the new bed
        if (input.status === 'IP_TRANSFERRED' && input.currentBedId) {
            await (0, database_1.query)("UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1", [input.currentBedId]);
            // Upgrade emergency patient to regular inpatient admission
            const admissionId = (0, uuid_1.v4)();
            await (0, database_1.query)(`
        INSERT INTO ip_admissions (admission_id, patient_id, admission_type, status, current_bed_id, reason_for_admission)
        VALUES ($1, $2, 'Emergency', 'Admitted', $3, $4)
      `, [admissionId, record.patient_id, input.currentBedId, `Transferred from Emergency care: MLC ${record.mlc_category || 'N/A'}`]);
        }
        const updateRes = await (0, database_1.query)('SELECT * FROM emergency_admissions WHERE emergency_id = $1', [input.emergencyId]);
        await (0, database_1.query)('COMMIT');
        return updateRes.rows[0];
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.updateEmergencyStatus = updateEmergencyStatus;
const createEmergencyOrder = async (input, userId) => {
    const orderId = (0, uuid_1.v4)();
    await (0, database_1.query)(`
    INSERT INTO emergency_orders (order_id, emergency_id, order_type, details, ordered_by, status)
    VALUES ($1, $2, $3, $4, $5, 'Pending')
  `, [orderId, input.emergencyId, input.orderType, input.details, userId]);
    const res = await (0, database_1.query)('SELECT * FROM emergency_orders WHERE order_id = $1', [orderId]);
    return res.rows[0];
};
exports.createEmergencyOrder = createEmergencyOrder;
const getEmergencyOrders = async (emergencyId) => {
    const res = await (0, database_1.query)(`
    SELECT eo.*, u.first_name, u.last_name
    FROM emergency_orders eo
    LEFT JOIN users u ON eo.ordered_by COLLATE utf8mb4_unicode_ci = u.user_id COLLATE utf8mb4_unicode_ci
    WHERE eo.emergency_id = $1
    ORDER BY eo.ordered_at DESC
  `, [emergencyId]);
    return res.rows;
};
exports.getEmergencyOrders = getEmergencyOrders;
const updateEmergencyOrderStatus = async (orderId, status) => {
    await (0, database_1.query)(`
    UPDATE emergency_orders SET status = $1 WHERE order_id = $2
  `, [status, orderId]);
    const res = await (0, database_1.query)('SELECT * FROM emergency_orders WHERE order_id = $1', [orderId]);
    return res.rows[0];
};
exports.updateEmergencyOrderStatus = updateEmergencyOrderStatus;
const getActiveEmergencyPatients = async () => {
    const res = await (0, database_1.query)(`
    SELECT ea.*, p.first_name, p.last_name, p.gender, p.mrn as medical_record_number, hb.bed_number, hb.ward_name
    FROM emergency_admissions ea
    JOIN patients p ON ea.patient_id COLLATE utf8mb4_unicode_ci = p.patient_id COLLATE utf8mb4_unicode_ci
    LEFT JOIN hospital_beds hb ON ea.current_bed_id COLLATE utf8mb4_unicode_ci = hb.bed_id COLLATE utf8mb4_unicode_ci
    WHERE ea.status = 'IN_ER_CARE'
    ORDER BY 
      CASE ea.triage_priority 
        WHEN 'RED' THEN 1
        WHEN 'ORANGE' THEN 2
        WHEN 'YELLOW' THEN 3
        WHEN 'GREEN' THEN 4
        ELSE 5
      END, 
      ea.admitted_at DESC
  `);
    return res.rows;
};
exports.getActiveEmergencyPatients = getActiveEmergencyPatients;
//# sourceMappingURL=emergency.service.js.map