"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBed = exports.editBed = exports.addBed = exports.dischargePatient = exports.transferBed = exports.admitEmergencyFastTrack = exports.admitRoutine = exports.getActiveAdmissions = exports.getBeds = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const uuid_1 = require("uuid");
const getBeds = async () => {
    const result = await (0, database_1.query)('SELECT * FROM hospital_beds ORDER BY floor, ward_name, bed_number');
    return result.rows;
};
exports.getBeds = getBeds;
const getActiveAdmissions = async () => {
    const result = await (0, database_1.query)(`
    SELECT ip.*, p.first_name, p.last_name, p.mrn as medical_record_number,
           ip.bed_number, ip.ward_type as ward_name,
           u.first_name as doc_first, u.last_name as doc_last
    FROM ip_admissions ip
    JOIN patients p ON ip.patient_id COLLATE utf8mb4_unicode_ci = p.patient_id COLLATE utf8mb4_unicode_ci
    LEFT JOIN users u ON ip.doctor_id COLLATE utf8mb4_unicode_ci = u.user_id COLLATE utf8mb4_unicode_ci
    WHERE ip.status != 'Discharged'
    ORDER BY ip.admission_date DESC
  `);
    return result.rows;
};
exports.getActiveAdmissions = getActiveAdmissions;
const admitRoutine = async (input) => {
    // Check if bed is available
    const bedRes = await (0, database_1.query)('SELECT * FROM hospital_beds WHERE bed_id = $1', [input.targetBedId]);
    if (bedRes.rows.length === 0 || bedRes.rows[0].status !== 'Available') {
        throw new errorHandler_1.AppError('Selected bed is not available', 400);
    }
    const bed = bedRes.rows[0];
    const admissionId = (0, uuid_1.v4)();
    const admissionNumber = `IP-${Date.now().toString(36).toUpperCase()}`;
    // Set patient to inpatient
    try {
        await (0, database_1.query)('UPDATE patients SET is_inpatient = TRUE WHERE patient_id = $1', [input.patientId]);
    }
    catch (pErr) {
        console.warn('Failed to update patient is_inpatient flag:', pErr);
    }
    // Mark bed occupied
    await (0, database_1.query)("UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1", [input.targetBedId]);
    // Create admission using actual ip_admissions columns
    await (0, database_1.query)(`
    INSERT INTO ip_admissions (admission_id, admission_number, patient_id, doctor_id, bed_number, ward_type, status, reason_for_admission)
    VALUES ($1, $2, $3, $4, $5, $6, 'Admitted', $7)
  `, [admissionId, admissionNumber, input.patientId, input.admittingDoctorId, bed.bed_number, bed.ward_type || 'General', input.reasonForAdmission]);
    // Create admission fee invoice
    try {
        const invoiceRes = await (0, database_1.query)(`
      INSERT INTO invoices (patient_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, status, payment_method, notes)
      VALUES ($1, 1000.00, 0.00, 0.00, 0.00, 1000.00, 1000.00, 'Paid', 'Cash', 'Inpatient Admission Fee Receipt') RETURNING *
    `, [input.patientId]);
        if (invoiceRes.rows[0]) {
            const invoiceId = invoiceRes.rows[0].invoice_id;
            await (0, database_1.query)(`
        INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price)
        VALUES ($1, 'Inpatient Admission Fee', 'Admission', 1, 1000.00)
      `, [invoiceId]);
        }
    }
    catch (invErr) {
        console.warn('Invoice creation skipped:', invErr);
    }
    const admissionRes = await (0, database_1.query)('SELECT * FROM ip_admissions WHERE admission_id = $1', [admissionId]);
    return admissionRes.rows[0];
};
exports.admitRoutine = admitRoutine;
const admitEmergencyFastTrack = async (input) => {
    // Create patient record
    const patientRes = await (0, database_1.query)(`
    INSERT INTO patients (first_name, last_name, phone, date_of_birth, gender, blood_group, is_inpatient)
    VALUES ($1, $2, $3, '1900-01-01', 'Other', 'Unknown', TRUE) RETURNING *
  `, [input.firstName, input.lastName, input.emergencyContact || '']);
    const patientId = patientRes.rows[0].patient_id;
    // Check bed
    const bedRes = await (0, database_1.query)('SELECT * FROM hospital_beds WHERE bed_id = $1', [input.targetBedId]);
    if (bedRes.rows.length === 0 || bedRes.rows[0].status !== 'Available') {
        throw new errorHandler_1.AppError('Selected bed is not available', 400);
    }
    const bed = bedRes.rows[0];
    const admissionId = (0, uuid_1.v4)();
    const admissionNumber = `IP-EM-${Date.now().toString(36).toUpperCase()}`;
    // Mark bed occupied
    await (0, database_1.query)("UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1", [input.targetBedId]);
    // Create admission
    await (0, database_1.query)(`
    INSERT INTO ip_admissions (admission_id, admission_number, patient_id, doctor_id, bed_number, ward_type, status, reason_for_admission, diagnosis)
    VALUES ($1, $2, $3, $4, $5, $6, 'Admitted', $7, $8)
  `, [admissionId, admissionNumber, patientId, input.admittingDoctorId, bed.bed_number, bed.ward_type || 'General', input.reasonForAdmission, input.chiefComplaint]);
    // Create invoice
    try {
        const invoiceRes = await (0, database_1.query)(`
      INSERT INTO invoices (patient_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, status, payment_method, notes)
      VALUES ($1, 1000.00, 0.00, 0.00, 0.00, 1000.00, 1000.00, 'Paid', 'Cash', 'Emergency Inpatient Admission Fee') RETURNING *
    `, [patientId]);
        if (invoiceRes.rows[0]) {
            await (0, database_1.query)(`
        INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price)
        VALUES ($1, 'Emergency Inpatient Admission Fee', 'Admission', 1, 1000.00)
      `, [invoiceRes.rows[0].invoice_id]);
        }
    }
    catch (invErr) {
        console.warn('Invoice creation skipped:', invErr);
    }
    // Create EMR encounter
    try {
        await (0, database_1.query)(`
      INSERT INTO encounters (patient_id, provider_id, chief_complaint, status)
      VALUES ($1, $2, $3, 'Active')
    `, [patientId, input.admittingDoctorId, input.chiefComplaint]);
    }
    catch (encErr) {
        console.warn('Encounter creation skipped:', encErr);
    }
    const admissionRes = await (0, database_1.query)('SELECT * FROM ip_admissions WHERE admission_id = $1', [admissionId]);
    return { patient: patientRes.rows[0], admission: admissionRes.rows[0] };
};
exports.admitEmergencyFastTrack = admitEmergencyFastTrack;
const transferBed = async (input, userId) => {
    // Find admission
    const admissionRes = await (0, database_1.query)(`SELECT admission_id, bed_number, patient_id FROM ip_admissions WHERE admission_id = $1 AND status != 'Discharged'`, [input.ipAdmissionId]);
    if (admissionRes.rows.length === 0)
        throw new errorHandler_1.AppError("Active IP tracking reference not found.", 404);
    const oldBedNumber = admissionRes.rows[0].bed_number;
    // Check new bed
    const newBedRes = await (0, database_1.query)('SELECT * FROM hospital_beds WHERE bed_id = $1', [input.targetBedId]);
    if (newBedRes.rows.length === 0 || newBedRes.rows[0].status !== 'Available') {
        throw new errorHandler_1.AppError("Target bed is not available", 400);
    }
    const newBed = newBedRes.rows[0];
    // Free old bed (by bed_number)
    await (0, database_1.query)(`UPDATE hospital_beds SET status = 'Available' WHERE bed_number = $1`, [oldBedNumber]);
    // Occupy new bed
    await (0, database_1.query)(`UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1`, [input.targetBedId]);
    // Log transfer
    const transferId = (0, uuid_1.v4)();
    await (0, database_1.query)(`INSERT INTO ip_transfers (transfer_id, admission_id, from_bed_id, to_bed_id, transferred_by, transfer_reason)
     VALUES ($1, $2, $3, $4, $5, $6)`, [transferId, input.ipAdmissionId, oldBedNumber, input.targetBedId, userId, input.transferReason]);
    // Update admission
    await (0, database_1.query)(`UPDATE ip_admissions SET bed_number = $1, ward_type = $2, status = 'Transferred' WHERE admission_id = $3`, [newBed.bed_number, newBed.ward_type || 'General', input.ipAdmissionId]);
    return { success: true, message: "Patient ward shifting completed safely." };
};
exports.transferBed = transferBed;
const dischargePatient = async (ipAdmissionId) => {
    const admissionRes = await (0, database_1.query)(`SELECT admission_id, bed_number, patient_id FROM ip_admissions WHERE admission_id = $1 AND status != 'Discharged'`, [ipAdmissionId]);
    if (admissionRes.rows.length === 0)
        throw new errorHandler_1.AppError("Active IP admission not found.", 404);
    const { bed_number, patient_id } = admissionRes.rows[0];
    // Free bed
    await (0, database_1.query)(`UPDATE hospital_beds SET status = 'Available' WHERE bed_number = $1`, [bed_number]);
    // Update patient status
    await (0, database_1.query)(`UPDATE patients SET is_inpatient = FALSE WHERE patient_id = $1`, [patient_id]);
    // Update admission status
    await (0, database_1.query)(`UPDATE ip_admissions SET status = 'Discharged', discharge_date = CURRENT_TIMESTAMP, discharged_at = CURRENT_TIMESTAMP WHERE admission_id = $1`, [ipAdmissionId]);
    return { success: true };
};
exports.dischargePatient = dischargePatient;
// CRUD for Beds
const addBed = async (input) => {
    const bedId = (0, uuid_1.v4)();
    await (0, database_1.query)(`INSERT INTO hospital_beds (bed_id, bed_number, ward_name, ward_type, daily_rate, floor, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`, [bedId, input.bedNumber, input.wardName, input.wardType, input.dailyRate, input.floor, input.status]);
    const result = await (0, database_1.query)('SELECT * FROM hospital_beds WHERE bed_id = $1', [bedId]);
    return result.rows[0];
};
exports.addBed = addBed;
const editBed = async (bedId, input) => {
    const currentStatusRes = await (0, database_1.query)('SELECT status FROM hospital_beds WHERE bed_id = $1', [bedId]);
    if (currentStatusRes.rows.length === 0) {
        throw new errorHandler_1.AppError('Bed not found', 404);
    }
    if (currentStatusRes.rows[0].status === 'Occupied' && input.status !== 'Occupied') {
        throw new errorHandler_1.AppError('Cannot change status of an occupied bed. Discharge the patient first.', 400);
    }
    await (0, database_1.query)(`UPDATE hospital_beds
     SET bed_number = $1, ward_name = $2, ward_type = $3, daily_rate = $4, floor = $5, status = $6
     WHERE bed_id = $7`, [input.bedNumber, input.wardName, input.wardType, input.dailyRate, input.floor, input.status, bedId]);
    const result = await (0, database_1.query)('SELECT * FROM hospital_beds WHERE bed_id = $1', [bedId]);
    return result.rows[0];
};
exports.editBed = editBed;
const deleteBed = async (bedId) => {
    const currentStatusRes = await (0, database_1.query)('SELECT status FROM hospital_beds WHERE bed_id = $1', [bedId]);
    if (currentStatusRes.rows.length === 0) {
        throw new errorHandler_1.AppError('Bed not found', 404);
    }
    if (currentStatusRes.rows[0].status === 'Occupied') {
        throw new errorHandler_1.AppError('Cannot delete an occupied bed. Discharge the patient first.', 400);
    }
    await (0, database_1.query)('DELETE FROM hospital_beds WHERE bed_id = $1', [bedId]);
    return { success: true };
};
exports.deleteBed = deleteBed;
//# sourceMappingURL=ip.service.js.map