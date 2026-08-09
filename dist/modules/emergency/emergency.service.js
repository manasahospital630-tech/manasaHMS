"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveEmergencyPatients = exports.updateEmergencyOrderStatus = exports.getEmergencyOrders = exports.createEmergencyOrder = exports.updateEmergencyStatus = exports.getEmergencyVitalsHistory = exports.logEmergencyVitals = exports.saveDigitalConsent = exports.getEmergencyConsents = exports.generatePoliceIntimation = exports.checkAndTriggerPoliceIntimation = exports.admitEmergencyPatient = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
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
        // Create patient record
        const patientRes = await (0, database_1.query)(`
      INSERT INTO patients (first_name, last_name, gender, date_of_birth, is_inpatient)
      VALUES ($1, $2, $3, '1900-01-01', TRUE) RETURNING *
    `, [firstName, lastName, input.gender]);
        const patientId = patientRes.rows[0].patient_id;
        // Create admission
        const admissionRes = await (0, database_1.query)(`
      INSERT INTO emergency_admissions (
        emergency_tracking_id, patient_id, is_unknown, estimated_age, physical_marks,
        belongings_inventory, is_mlc, mlc_category, triage_priority,
        brought_by_name, brought_by_phone, brought_by_relation,
        police_badge_number, police_station, police_officer_name,
        current_bed_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'IN_ER_CARE') RETURNING *
    `, [
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
        const emergencyRecord = admissionRes.rows[0];
        // Create general EMR encounter so SOAP notes can be appended
        await (0, database_1.query)(`
      INSERT INTO encounters (patient_id, provider_id, chief_complaint, status)
      VALUES ($1, $2, $3, 'Active')
    `, [patientId, input.admittingDoctorId, `Emergency Admission: ${input.mlcCategory || 'General trauma'}`]);
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
    const mlcCategoriesRequiringPolice = ['ACCIDENT', 'SUICIDE_ATTEMPT', 'ASSAULT', 'GUNSHOT', 'POISONING'];
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
    const record = recordRes.rows[0];
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
    const res = await (0, database_1.query)(`
    INSERT INTO emergency_consents (emergency_id, consent_type, signatory_name, relation, signature_data_url)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `, [input.emergencyId, input.consentType, input.signatoryName, input.relation || null, input.signatureDataUrl]);
    return res.rows[0];
};
exports.saveDigitalConsent = saveDigitalConsent;
const logEmergencyVitals = async (input) => {
    const res = await (0, database_1.query)(`
    INSERT INTO emergency_vitals_log (emergency_id, bp_sys, bp_dia, pulse, spo2, respiratory_rate, gcs_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
  `, [
        input.emergencyId,
        input.bpSys || null,
        input.bpDia || null,
        input.pulse || null,
        input.spo2 || null,
        input.respiratoryRate || null,
        input.gcsScore || null
    ]);
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
        const updateRes = await (0, database_1.query)(`
      UPDATE emergency_admissions
      SET status = $1, current_bed_id = $2, discharged_at = $3
      WHERE emergency_id = $4 RETURNING *
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
            await (0, database_1.query)(`
        INSERT INTO ip_admissions (patient_id, admission_type, status, current_bed_id, reason_for_admission)
        VALUES ($1, 'Emergency', 'Admitted', $2, $3)
      `, [record.patient_id, input.currentBedId, `Transferred from Emergency care: MLC ${record.mlc_category || 'N/A'}`]);
        }
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
    const res = await (0, database_1.query)(`
    INSERT INTO emergency_orders (emergency_id, order_type, details, ordered_by, status)
    VALUES ($1, $2, $3, $4, 'Pending') RETURNING *
  `, [input.emergencyId, input.orderType, input.details, userId]);
    return res.rows[0];
};
exports.createEmergencyOrder = createEmergencyOrder;
const getEmergencyOrders = async (emergencyId) => {
    const res = await (0, database_1.query)(`
    SELECT eo.*, u.first_name, u.last_name
    FROM emergency_orders eo
    LEFT JOIN users u ON eo.ordered_by = u.user_id
    WHERE eo.emergency_id = $1
    ORDER BY eo.ordered_at DESC
  `, [emergencyId]);
    return res.rows;
};
exports.getEmergencyOrders = getEmergencyOrders;
const updateEmergencyOrderStatus = async (orderId, status) => {
    const res = await (0, database_1.query)(`
    UPDATE emergency_orders SET status = $1 WHERE order_id = $2 RETURNING *
  `, [status, orderId]);
    return res.rows[0];
};
exports.updateEmergencyOrderStatus = updateEmergencyOrderStatus;
const getActiveEmergencyPatients = async () => {
    const res = await (0, database_1.query)(`
    SELECT ea.*, p.first_name, p.last_name, p.gender, p.medical_record_number, hb.bed_number, hb.ward_name
    FROM emergency_admissions ea
    JOIN patients p ON ea.patient_id = p.patient_id
    LEFT JOIN hospital_beds hb ON ea.current_bed_id = hb.bed_id
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