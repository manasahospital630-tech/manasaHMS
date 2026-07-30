"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncounterByIpAdmissionId = exports.updateEncounterSOAP = exports.updateEncounterVitals = exports.getEncounterById = exports.getPatientEncounters = exports.createEncounter = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const createEncounter = async (providerId, input) => {
    const result = await (0, database_1.query)(`INSERT INTO encounters (patient_id, appointment_id, provider_id, chief_complaint,
      systolic_bp, diastolic_bp, pulse_rate, temperature_celsius, weight_kg, height_cm, spo2,
      soap_subjective, soap_objective, soap_assessment, soap_plan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`, [input.patientId, input.appointmentId || null, providerId, input.chiefComplaint,
        input.systolicBp || null, input.diastolicBp || null, input.pulseRate || null,
        input.temperatureCelsius || null, input.weightKg || null, input.heightCm || null, input.spo2 || null,
        input.soapSubjective || null, input.soapObjective || null, input.soapAssessment || null, input.soapPlan || null]);
    return result.rows[0];
};
exports.createEncounter = createEncounter;
const getPatientEncounters = async (patientId) => {
    const encounters = await (0, database_1.query)(`SELECT e.*, u.first_name || ' ' || u.last_name as provider_name
     FROM encounters e JOIN users u ON e.provider_id = u.user_id
     WHERE e.patient_id = $1 ORDER BY e.encounter_timestamp DESC`, [patientId]);
    for (const enc of encounters.rows) {
        const diagnoses = await (0, database_1.query)('SELECT * FROM diagnoses WHERE encounter_id = $1 ORDER BY is_primary DESC, recorded_at ASC', [enc.encounter_id]);
        enc.diagnoses = diagnoses.rows;
    }
    return encounters.rows;
};
exports.getPatientEncounters = getPatientEncounters;
const getEncounterById = async (id) => {
    const result = await (0, database_1.query)(`SELECT e.*, u.first_name || ' ' || u.last_name as provider_name,
            p.first_name || ' ' || p.last_name as patient_name, p.medical_record_number
     FROM encounters e
     JOIN users u ON e.provider_id = u.user_id
     JOIN patients p ON e.patient_id = p.patient_id
     WHERE e.encounter_id = $1`, [id]);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Encounter not found.', 404);
    const diagnoses = await (0, database_1.query)('SELECT * FROM diagnoses WHERE encounter_id = $1', [id]);
    const encounter = result.rows[0];
    encounter.diagnoses = diagnoses.rows;
    return encounter;
};
exports.getEncounterById = getEncounterById;
const updateEncounterVitals = async (id, input) => {
    const fields = [];
    const values = [];
    const fieldMap = {
        systolicBp: 'systolic_bp', diastolicBp: 'diastolic_bp', pulseRate: 'pulse_rate',
        temperatureCelsius: 'temperature_celsius', weightKg: 'weight_kg', heightCm: 'height_cm',
        spo2: 'spo2', chiefComplaint: 'chief_complaint',
    };
    let idx = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
        if (input[key] !== undefined) {
            fields.push(`${col} = $${idx}`);
            values.push(input[key]);
            idx++;
        }
    }
    if (fields.length === 0)
        throw new errorHandler_1.AppError('No vitals to update.', 400);
    values.push(id);
    const result = await (0, database_1.query)(`UPDATE encounters SET ${fields.join(', ')} WHERE encounter_id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Encounter not found.', 404);
    return result.rows[0];
};
exports.updateEncounterVitals = updateEncounterVitals;
const updateEncounterSOAP = async (id, input) => {
    const fields = [];
    const values = [];
    const fieldMap = {
        soapSubjective: 'soap_subjective', soapObjective: 'soap_objective',
        soapAssessment: 'soap_assessment', soapPlan: 'soap_plan',
    };
    let idx = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
        if (input[key] !== undefined) {
            fields.push(`${col} = $${idx}`);
            values.push(input[key]);
            idx++;
        }
    }
    if (fields.length === 0)
        throw new errorHandler_1.AppError('No SOAP notes to update.', 400);
    values.push(id);
    const result = await (0, database_1.query)(`UPDATE encounters SET ${fields.join(', ')} WHERE encounter_id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Encounter not found.', 404);
    return result.rows[0];
};
exports.updateEncounterSOAP = updateEncounterSOAP;
const getEncounterByIpAdmissionId = async (ipAdmissionId) => {
    const result = await (0, database_1.query)(`SELECT e.*, u.first_name || ' ' || u.last_name as provider_name,
            p.first_name || ' ' || p.last_name as patient_name, p.medical_record_number,
            p.phone
     FROM encounters e
     JOIN users u ON e.provider_id = u.user_id
     JOIN patients p ON e.patient_id = p.patient_id
     WHERE e.ip_admission_id = $1 ORDER BY e.encounter_timestamp DESC LIMIT 1`, [ipAdmissionId]);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Encounter not found for this IP Admission.', 404);
    const encounter = result.rows[0];
    const diagnoses = await (0, database_1.query)('SELECT * FROM diagnoses WHERE encounter_id = $1', [encounter.encounter_id]);
    encounter.diagnoses = diagnoses.rows;
    return encounter;
};
exports.getEncounterByIpAdmissionId = getEncounterByIpAdmissionId;
//# sourceMappingURL=encounter.service.js.map