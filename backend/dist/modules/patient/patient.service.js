"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientFullTimeline = exports.givePortalAccess = exports.updatePatient = exports.getPatientById = exports.getPatients = exports.createPatient = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const database_1 = require("../../config/database");
const mrnGenerator_1 = require("../../utils/mrnGenerator");
const errorHandler_1 = require("../../middleware/errorHandler");
const createPatient = async (input) => {
    const mrn = await (0, mrnGenerator_1.generateMRN)();
    const patientId = (0, uuid_1.v4)();
    let ageVal = null;
    if (input.age !== undefined && input.age !== null && input.age !== '') {
        ageVal = parseInt(String(input.age), 10);
    }
    let dob = input.dateOfBirth;
    if (!dob && ageVal !== null && !isNaN(ageVal)) {
        const currentYear = new Date().getFullYear();
        dob = `${currentYear - ageVal}-01-01`;
    }
    if (!dob) {
        dob = '1990-01-01';
    }
    await (0, database_1.query)(`INSERT INTO patients (
      patient_id, mrn, first_name, last_name, gender, date_of_birth,
      blood_group, phone, email, address, emergency_contact_name, emergency_contact_phone
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
        patientId,
        mrn,
        input.firstName,
        input.lastName,
        input.gender,
        dob,
        input.bloodGroup || null,
        input.phone || null,
        input.email || null,
        input.address || null,
        input.emergencyContactName || null,
        input.emergencyContactPhone || null,
    ]);
    const created = await (0, database_1.query)(`SELECT * FROM patients WHERE patient_id = $1`, [patientId]);
    const row = created.rows[0];
    return {
        ...row,
        medical_record_number: row.mrn
    };
};
exports.createPatient = createPatient;
const getPatients = async (options) => {
    const { search, limit = 25, offset = 0 } = options;
    let whereClause = '';
    let orderByClause = 'ORDER BY p.created_at DESC';
    const dataParams = [];
    const countParams = [];
    if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        dataParams.push(term, term, term, term, term); // $1..$5
        countParams.push(term, term, term, term, term);
        whereClause = `WHERE LOWER(COALESCE(p.phone, '')) LIKE LOWER($1) 
       OR LOWER(p.first_name) LIKE LOWER($2) 
       OR LOWER(p.last_name) LIKE LOWER($3) 
       OR LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER($4)
       OR LOWER(COALESCE(p.mrn, '')) LIKE LOWER($5)`;
    }
    const countWhere = search && search.trim()
        ? `WHERE LOWER(COALESCE(p.phone, '')) LIKE LOWER($1) OR LOWER(p.first_name) LIKE LOWER($2) OR LOWER(p.last_name) LIKE LOWER($3) OR LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER($4) OR LOWER(COALESCE(p.mrn, '')) LIKE LOWER($5)`
        : '';
    const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM patients p ${countWhere}`, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);
    dataParams.push(limit, offset);
    const limitParamIdx = dataParams.length - 1;
    const offsetParamIdx = dataParams.length;
    const result = await (0, database_1.query)(`SELECT p.*, p.mrn as medical_record_number, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.patient_id = d.user_id
     ${whereClause}
     ${orderByClause}
     LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`, dataParams);
    const formattedPatients = result.rows.map(r => ({
        ...r,
        medical_record_number: r.mrn || r.medical_record_number || 'MRN-000000'
    }));
    return {
        patients: formattedPatients,
        pagination: {
            total,
            limit,
            offset,
            totalPages: Math.ceil(total / limit),
        },
    };
};
exports.getPatients = getPatients;
const getPatientById = async (patientId) => {
    const result = await (0, database_1.query)(`SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.assigned_doctor_id = d.user_id
     WHERE p.patient_id = $1`, [patientId]);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Patient not found.', 404);
    }
    return result.rows[0];
};
exports.getPatientById = getPatientById;
const updatePatient = async (patientId, input) => {
    // First check that patient exists
    const existing = await (0, database_1.query)('SELECT patient_id FROM patients WHERE patient_id = $1', [patientId]);
    if (existing.rows.length === 0) {
        throw new errorHandler_1.AppError('Patient not found.', 404);
    }
    // Build dynamic SET clause
    const fieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        dateOfBirth: 'date_of_birth',
        gender: 'gender',
        bloodGroup: 'blood_group',
        address: 'address',
        phone: 'phone',
        email: 'email',
        emergencyContactName: 'emergency_contact_name',
        emergencyContactPhone: 'emergency_contact_phone',
        insuranceProvider: 'insurance_provider',
        insurancePolicyNumber: 'insurance_policy_number',
        allergies: 'allergies',
        assignedDoctorId: 'assigned_doctor_id',
        referredBy: 'referred_by',
    };
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, column] of Object.entries(fieldMap)) {
        if (input[key] !== undefined) {
            setClauses.push(`${column} = $${paramIndex}`);
            values.push(input[key]);
            paramIndex++;
        }
    }
    if (setClauses.length === 0) {
        throw new errorHandler_1.AppError('No fields to update.', 400);
    }
    values.push(patientId);
    const result = await (0, database_1.query)(`UPDATE patients SET ${setClauses.join(', ')} WHERE patient_id = $${paramIndex} RETURNING *`, values);
    return result.rows[0];
};
exports.updatePatient = updatePatient;
const givePortalAccess = async (patientId) => {
    const patient = await (0, exports.getPatientById)(patientId);
    if (patient.user_id) {
        throw new errorHandler_1.AppError('Patient already has portal access.', 400);
    }
    if (!patient.email) {
        throw new errorHandler_1.AppError('Patient must have an email address to activate portal access.', 400);
    }
    // Check if user already exists
    const existingUserRes = await (0, database_1.query)('SELECT user_id, role FROM users WHERE email = $1', [patient.email]);
    let userId;
    const defaultPassword = `Patient@${patient.medical_record_number.replace(/[^a-zA-Z0-9]/g, '')}`;
    if (existingUserRes.rows.length > 0) {
        const user = existingUserRes.rows[0];
        if (user.role !== 'Patient') {
            throw new errorHandler_1.AppError('This email is already in use by a staff account.', 400);
        }
        userId = user.user_id;
    }
    else {
        // Create new patient user
        const passwordHash = await bcryptjs_1.default.hash(defaultPassword, 12);
        const userRes = await (0, database_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'Patient') RETURNING user_id`, [patient.email, passwordHash, patient.first_name, patient.last_name]);
        userId = userRes.rows[0].user_id;
    }
    // Link user to patient
    await (0, database_1.query)('UPDATE patients SET user_id = $1 WHERE patient_id = $2', [userId, patientId]);
    return {
        email: patient.email,
        password: defaultPassword
    };
};
exports.givePortalAccess = givePortalAccess;
const getPatientFullTimeline = async (patientId) => {
    // 1. Core Patient Specs
    const patientRes = await (0, database_1.query)(`SELECT p.*, p.mrn as medical_record_number
     FROM patients p
     WHERE p.patient_id = $1`, [patientId]);
    if (patientRes.rows.length === 0) {
        throw new errorHandler_1.AppError('Patient not found.', 404);
    }
    const patient = patientRes.rows[0];
    // 2. Encounters / Consultations (Fault tolerant)
    let encounters = [];
    try {
        const encountersRes = await (0, database_1.query)(`SELECT e.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as provider_name
       FROM encounters e
       JOIN users u ON e.doctor_id = u.user_id
       WHERE e.patient_id = $1
       ORDER BY e.created_at DESC`, [patientId]);
        encounters = encountersRes.rows;
        for (const enc of encounters) {
            try {
                const diagnosesRes = await (0, database_1.query)(`SELECT * FROM diagnoses WHERE encounter_id = $1 ORDER BY is_primary DESC`, [enc.encounter_id]);
                enc.diagnoses = diagnosesRes.rows;
            }
            catch {
                enc.diagnoses = [];
            }
        }
    }
    catch (err) {
        console.warn('Encounters query skipped:', err);
        encounters = [];
    }
    // 3. Prescriptions & Active Meds (Fault tolerant)
    let prescriptions = [];
    const activeMedications = [];
    try {
        const rxRes = await (0, database_1.query)(`SELECT pr.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as doctor_name
       FROM prescriptions pr
       LEFT JOIN users u ON pr.doctor_id = u.user_id
       WHERE pr.patient_id = $1`, [patientId]);
        prescriptions = rxRes.rows;
        for (const rx of prescriptions) {
            try {
                const itemsRes = await (0, database_1.query)(`SELECT pi.*, COALESCE(i.name, pi.medication_name) as med_name
           FROM prescription_items pi
           LEFT JOIN inventory_items i ON pi.inventory_id = i.inventory_id
           WHERE pi.prescription_id = $1`, [rx.prescription_id]);
                rx.items = itemsRes.rows;
                for (const item of itemsRes.rows) {
                    activeMedications.push({
                        medication_name: item.med_name || item.item_name || 'Medication',
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration,
                        fulfillment_status: rx.status || 'Active',
                        prescribed_date: rx.issued_at || rx.created_at,
                        prescription_id: rx.prescription_id
                    });
                }
            }
            catch {
                rx.items = [];
            }
        }
    }
    catch (err) {
        console.warn('Prescriptions query skipped:', err);
        prescriptions = [];
    }
    // 4. Lab & Diagnostic Orders (Fault tolerant)
    let labOrders = [];
    try {
        const labOrdersRes = await (0, database_1.query)(`SELECT tor.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as doctor_name
       FROM test_orders tor
       LEFT JOIN users u ON tor.doctor_id = u.user_id
       WHERE tor.patient_id = $1`, [patientId]);
        labOrders = labOrdersRes.rows;
        for (const order of labOrders) {
            try {
                const orderItemsRes = await (0, database_1.query)(`SELECT toi.*, ds.name as test_name, ds.service_code, ds.sample_required,
                  dc.name as category_name
           FROM test_order_items toi
           LEFT JOIN diagnostic_services ds ON toi.service_id = ds.service_id
           LEFT JOIN diagnostic_categories dc ON ds.category_id = dc.category_id
           WHERE toi.order_id = $1`, [order.order_id]);
                order.items = orderItemsRes.rows;
                for (const item of order.items) {
                    try {
                        const resultsRes = await (0, database_1.query)(`SELECT lrp.*, lrp.parameter_name as name, lrp.actual_value as result_value,
                      lrp.reference_range as normal_range, lrp.unit
               FROM lab_result_parameters lrp
               WHERE lrp.order_item_id = $1
               ORDER BY lrp.created_at ASC`, [item.item_id]);
                        item.results = resultsRes.rows;
                    }
                    catch {
                        item.results = [];
                    }
                }
            }
            catch {
                order.items = [];
            }
        }
    }
    catch (err) {
        console.warn('Lab orders query skipped:', err);
        labOrders = [];
    }
    // 5. Vitals History Series for Trend Graphing (Fault tolerant)
    let vitalsSeries = [];
    try {
        const vitalsSeriesRes = await (0, database_1.query)(`SELECT encounter_id, created_at as encounter_timestamp, systolic_bp, diastolic_bp, pulse_rate,
              temperature_celsius, weight_kg, spo2
       FROM encounters
       WHERE patient_id = $1`, [patientId]);
        vitalsSeries = vitalsSeriesRes.rows;
    }
    catch (err) {
        console.warn('Vitals query skipped:', err);
        vitalsSeries = [];
    }
    // 6. Upcoming Appointments (Fault tolerant)
    let upcomingAppointments = [];
    try {
        const appointmentsRes = await (0, database_1.query)(`SELECT a.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as doctor_name
       FROM appointments a
       LEFT JOIN users u ON a.doctor_id = u.user_id
       WHERE a.patient_id = $1`, [patientId]);
        upcomingAppointments = appointmentsRes.rows;
    }
    catch (err) {
        console.warn('Appointments query skipped:', err);
        upcomingAppointments = [];
    }
    let parsedVitalsHistory = [];
    if (patient.vitals_history) {
        if (typeof patient.vitals_history === 'string') {
            try {
                parsedVitalsHistory = JSON.parse(patient.vitals_history);
            }
            catch {
                parsedVitalsHistory = [];
            }
        }
        else if (Array.isArray(patient.vitals_history)) {
            parsedVitalsHistory = patient.vitals_history;
        }
    }
    let parsedCurrentVitals = {};
    if (patient.current_vitals) {
        if (typeof patient.current_vitals === 'string') {
            try {
                parsedCurrentVitals = JSON.parse(patient.current_vitals);
            }
            catch {
                parsedCurrentVitals = {};
            }
        }
        else if (typeof patient.current_vitals === 'object') {
            parsedCurrentVitals = patient.current_vitals;
        }
    }
    return {
        patient,
        encounters,
        prescriptions,
        activeMedications,
        labOrders,
        vitalsSeries,
        vitalsHistory: parsedVitalsHistory,
        currentVitals: parsedCurrentVitals,
        upcomingAppointments
    };
};
exports.getPatientFullTimeline = getPatientFullTimeline;
//# sourceMappingURL=patient.service.js.map