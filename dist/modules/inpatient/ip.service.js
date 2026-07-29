"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBed = exports.editBed = exports.addBed = exports.dischargePatient = exports.transferBed = exports.admitEmergencyFastTrack = exports.admitRoutine = exports.getActiveAdmissions = exports.getBeds = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const getBeds = async () => {
    const result = await (0, database_1.query)('SELECT * FROM hospital_beds ORDER BY floor, ward_name, bed_number');
    return result.rows;
};
exports.getBeds = getBeds;
const getActiveAdmissions = async () => {
    const result = await (0, database_1.query)(`
    SELECT ip.*, p.first_name, p.last_name, p.medical_record_number, b.bed_number, b.ward_name, u.first_name as doc_first, u.last_name as doc_last
    FROM ip_admissions ip
    JOIN patients p ON ip.patient_id = p.patient_id
    JOIN hospital_beds b ON ip.current_bed_id = b.bed_id
    JOIN users u ON ip.admitting_doctor_id = u.user_id
    WHERE ip.status != 'Discharged'
    ORDER BY ip.admitted_at DESC
  `);
    return result.rows;
};
exports.getActiveAdmissions = getActiveAdmissions;
const admitRoutine = async (input) => {
    await (0, database_1.query)('BEGIN');
    try {
        // Check if bed is available
        const bedRes = await (0, database_1.query)('SELECT status FROM hospital_beds WHERE bed_id = $1 FOR UPDATE', [input.targetBedId]);
        if (bedRes.rows.length === 0 || bedRes.rows[0].status !== 'Available') {
            throw new errorHandler_1.AppError('Selected bed is not available', 400);
        }
        // Set patient to inpatient
        await (0, database_1.query)('UPDATE patients SET is_inpatient = TRUE WHERE patient_id = $1', [input.patientId]);
        // Mark bed occupied
        await (0, database_1.query)("UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1", [input.targetBedId]);
        // Create admission
        const admissionRes = await (0, database_1.query)(`
      INSERT INTO ip_admissions (patient_id, admission_type, status, admitting_doctor_id, current_bed_id, reason_for_admission)
      VALUES ($1, $2, 'Admitted', $3, $4, $5) RETURNING *
    `, [input.patientId, input.admissionType, input.admittingDoctorId, input.targetBedId, input.reasonForAdmission]);
        const admissionId = admissionRes.rows[0].ip_admission_id;
        // Create admission fee invoice (amount_paid: 1000.00, total_amount: 1000.00, status: 'Paid', payment_method: 'Cash')
        const invoiceRes = await (0, database_1.query)(`
      INSERT INTO invoices (patient_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, status, payment_method, notes, ip_admission_id)
      VALUES ($1, 1000.00, 0.00, 0.00, 0.00, 1000.00, 1000.00, 'Paid', 'Cash', 'Inpatient Admission Fee Receipt', $2) RETURNING *
    `, [input.patientId, admissionId]);
        const invoiceId = invoiceRes.rows[0].invoice_id;
        // Create invoice item
        await (0, database_1.query)(`
      INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price)
      VALUES ($1, 'Inpatient Admission Fee', 'Admission', 1, 1000.00)
    `, [invoiceId]);
        // If emergency, create an encounter
        if (input.admissionType === 'Emergency') {
            await (0, database_1.query)(`
        INSERT INTO encounters (patient_id, provider_id, chief_complaint, status, ip_admission_id)
        VALUES ($1, $2, $3, 'Active', $4)
      `, [input.patientId, input.admittingDoctorId, input.reasonForAdmission, admissionId]);
        }
        await (0, database_1.query)('COMMIT');
        return { ...admissionRes.rows[0], invoice_id: invoiceId };
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.admitRoutine = admitRoutine;
const admitEmergencyFastTrack = async (input) => {
    await (0, database_1.query)('BEGIN');
    try {
        const bedRes = await (0, database_1.query)('SELECT status FROM hospital_beds WHERE bed_id = $1 FOR UPDATE', [input.targetBedId]);
        if (bedRes.rows.length === 0 || bedRes.rows[0].status !== 'Available') {
            throw new errorHandler_1.AppError('Selected bed is not available', 400);
        }
        // Create patient record
        const patientRes = await (0, database_1.query)(`
      INSERT INTO patients (first_name, last_name, phone, date_of_birth, gender, blood_group, is_inpatient)
      VALUES ($1, $2, $3, '1900-01-01', 'Other', 'Unknown', TRUE) RETURNING *
    `, [input.firstName, input.lastName, input.emergencyContact || '']);
        const patientId = patientRes.rows[0].patient_id;
        // Mark bed occupied
        await (0, database_1.query)("UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1", [input.targetBedId]);
        // Create admission
        const admissionRes = await (0, database_1.query)(`
      INSERT INTO ip_admissions (patient_id, admission_type, status, admitting_doctor_id, current_bed_id, reason_for_admission)
      VALUES ($1, 'Emergency', 'Admitted', $2, $3, $4) RETURNING *
    `, [patientId, input.admittingDoctorId, input.targetBedId, input.reasonForAdmission]);
        const admissionId = admissionRes.rows[0].ip_admission_id;
        // Create admission fee invoice
        const invoiceRes = await (0, database_1.query)(`
      INSERT INTO invoices (patient_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, status, payment_method, notes, ip_admission_id)
      VALUES ($1, 1000.00, 0.00, 0.00, 0.00, 1000.00, 1000.00, 'Paid', 'Cash', 'Inpatient Admission Fee Receipt', $2) RETURNING *
    `, [patientId, admissionId]);
        const invoiceId = invoiceRes.rows[0].invoice_id;
        await (0, database_1.query)(`
      INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price)
      VALUES ($1, 'Inpatient Admission Fee', 'Admission', 1, 1000.00)
    `, [invoiceId]);
        // Create EMR encounter
        await (0, database_1.query)(`
      INSERT INTO encounters (patient_id, provider_id, chief_complaint, status, ip_admission_id)
      VALUES ($1, $2, $3, 'Active', $4)
    `, [patientId, input.admittingDoctorId, input.chiefComplaint, admissionId]);
        await (0, database_1.query)('COMMIT');
        return { patient: patientRes.rows[0], admission: admissionRes.rows[0], invoice_id: invoiceId };
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.admitEmergencyFastTrack = admitEmergencyFastTrack;
const transferBed = async (input, userId) => {
    await (0, database_1.query)('BEGIN');
    try {
        const admissionRes = await (0, database_1.query)(`SELECT current_bed_id, patient_id FROM ip_admissions WHERE ip_admission_id = $1 AND status != 'Discharged' FOR UPDATE`, [input.ipAdmissionId]);
        if (admissionRes.rows.length === 0)
            throw new errorHandler_1.AppError("Active IP tracking reference not found.", 404);
        const oldBedId = admissionRes.rows[0].current_bed_id;
        const newBedRes = await (0, database_1.query)('SELECT status FROM hospital_beds WHERE bed_id = $1 FOR UPDATE', [input.targetBedId]);
        if (newBedRes.rows.length === 0 || newBedRes.rows[0].status !== 'Available') {
            throw new errorHandler_1.AppError("Target bed is not available", 400);
        }
        await (0, database_1.query)(`UPDATE hospital_beds SET status = 'Available' WHERE bed_id = $1`, [oldBedId]);
        await (0, database_1.query)(`UPDATE hospital_beds SET status = 'Occupied' WHERE bed_id = $1`, [input.targetBedId]);
        await (0, database_1.query)(`INSERT INTO ip_transfers (ip_admission_id, from_bed_id, to_bed_id, transferred_by, transfer_reason) 
       VALUES ($1, $2, $3, $4, $5)`, [input.ipAdmissionId, oldBedId, input.targetBedId, userId, input.transferReason]);
        await (0, database_1.query)(`UPDATE ip_admissions SET current_bed_id = $1, status = 'Transferred' WHERE ip_admission_id = $2`, [input.targetBedId, input.ipAdmissionId]);
        await (0, database_1.query)('COMMIT');
        return { success: true, message: "Patient ward shifting completed safely." };
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.transferBed = transferBed;
const dischargePatient = async (ipAdmissionId) => {
    await (0, database_1.query)('BEGIN');
    try {
        const admissionRes = await (0, database_1.query)(`SELECT current_bed_id, patient_id FROM ip_admissions WHERE ip_admission_id = $1 AND status != 'Discharged' FOR UPDATE`, [ipAdmissionId]);
        if (admissionRes.rows.length === 0)
            throw new errorHandler_1.AppError("Active IP admission not found.", 404);
        const { current_bed_id, patient_id } = admissionRes.rows[0];
        // Free bed
        await (0, database_1.query)(`UPDATE hospital_beds SET status = 'Available' WHERE bed_id = $1`, [current_bed_id]);
        // Update patient status
        await (0, database_1.query)(`UPDATE patients SET is_inpatient = FALSE WHERE patient_id = $1`, [patient_id]);
        // Update admission status
        await (0, database_1.query)(`UPDATE ip_admissions SET status = 'Discharged', discharged_at = CURRENT_TIMESTAMP WHERE ip_admission_id = $1`, [ipAdmissionId]);
        await (0, database_1.query)('COMMIT');
        return { success: true };
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.dischargePatient = dischargePatient;
// CRUD for Beds
const addBed = async (input) => {
    const result = await (0, database_1.query)(`INSERT INTO hospital_beds (bed_number, ward_name, type, per_day_charge, floor, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [input.bedNumber, input.wardName, input.type, input.perDayCharge, input.floor, input.status]);
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
    const result = await (0, database_1.query)(`UPDATE hospital_beds 
     SET bed_number = $1, ward_name = $2, type = $3, per_day_charge = $4, floor = $5, status = $6
     WHERE bed_id = $7 RETURNING *`, [input.bedNumber, input.wardName, input.type, input.perDayCharge, input.floor, input.status, bedId]);
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