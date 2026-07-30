import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database';
import { generateMRN } from '../../utils/mrnGenerator';
import { CreatePatientInput, UpdatePatientInput } from './patient.schema';
import { AppError } from '../../middleware/errorHandler';

export const createPatient = async (input: CreatePatientInput) => {
  const mrn = await generateMRN();
  const patientId = uuidv4();

  let ageVal: number | null = null;
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

  await query(
    `INSERT INTO patients (
      patient_id, mrn, first_name, last_name, gender, date_of_birth,
      blood_group, phone, email, address, emergency_contact_name, emergency_contact_phone
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
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
    ]
  );

  const created = await query(`SELECT * FROM patients WHERE patient_id = $1`, [patientId]);
  const row = created.rows[0];
  return {
    ...row,
    medical_record_number: row.mrn
  };
};

export const getPatients = async (options: {
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const { search, limit = 25, offset = 0 } = options;
  let whereClause = '';
  let orderByClause = 'ORDER BY p.created_at DESC';
  const dataParams: any[] = [];
  const countParams: any[] = [];

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

  const countResult = await query(
    `SELECT COUNT(*) as total FROM patients p ${countWhere}`,
    countParams
  );

  const total = parseInt(countResult.rows[0]?.total || '0', 10);

  dataParams.push(limit, offset);
  const limitParamIdx = dataParams.length - 1;
  const offsetParamIdx = dataParams.length;

  const result = await query(
    `SELECT p.*, p.mrn as medical_record_number, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.patient_id = d.user_id
     ${whereClause}
     ${orderByClause}
     LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
    dataParams
  );

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

export const getPatientById = async (patientId: string) => {
  const result = await query(
    `SELECT p.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM patients p
     LEFT JOIN users d ON p.assigned_doctor_id = d.user_id
     WHERE p.patient_id = $1`,
    [patientId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Patient not found.', 404);
  }

  return result.rows[0];
};

export const updatePatient = async (patientId: string, input: UpdatePatientInput) => {
  // First check that patient exists
  const existing = await query('SELECT patient_id FROM patients WHERE patient_id = $1', [patientId]);
  if (existing.rows.length === 0) {
    throw new AppError('Patient not found.', 404);
  }

  // Build dynamic SET clause
  const fieldMap: Record<string, string> = {
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

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, column] of Object.entries(fieldMap)) {
    if ((input as any)[key] !== undefined) {
      setClauses.push(`${column} = $${paramIndex}`);
      values.push((input as any)[key]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw new AppError('No fields to update.', 400);
  }

  values.push(patientId);

  const result = await query(
    `UPDATE patients SET ${setClauses.join(', ')} WHERE patient_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

export const givePortalAccess = async (patientId: string) => {
  const patient = await getPatientById(patientId);
  if (patient.user_id) {
    throw new AppError('Patient already has portal access.', 400);
  }
  if (!patient.email) {
    throw new AppError('Patient must have an email address to activate portal access.', 400);
  }

  // Check if user already exists
  const existingUserRes = await query('SELECT user_id, role FROM users WHERE email = $1', [patient.email]);
  let userId: string;
  const defaultPassword = `Patient@${patient.medical_record_number.replace(/[^a-zA-Z0-9]/g, '')}`;

  if (existingUserRes.rows.length > 0) {
    const user = existingUserRes.rows[0];
    if (user.role !== 'Patient') {
      throw new AppError('This email is already in use by a staff account.', 400);
    }
    userId = user.user_id;
  } else {
    // Create new patient user
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const userRes = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'Patient') RETURNING user_id`,
      [patient.email, passwordHash, patient.first_name, patient.last_name]
    );
    userId = userRes.rows[0].user_id;
  }

  // Link user to patient
  await query('UPDATE patients SET user_id = $1 WHERE patient_id = $2', [userId, patientId]);

  return {
    email: patient.email,
    password: defaultPassword
  };
};

export const getPatientFullTimeline = async (patientId: string) => {
  // 1. Core Patient Specs
  const patientRes = await query(
    `SELECT p.*, p.mrn as medical_record_number
     FROM patients p
     WHERE p.patient_id = $1`,
    [patientId]
  );

  if (patientRes.rows.length === 0) {
    throw new AppError('Patient not found.', 404);
  }
  const patient = patientRes.rows[0];

  // 2. Encounters / Consultations (Fault tolerant)
  let encounters: any[] = [];
  try {
    const encountersRes = await query(
      `SELECT e.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as provider_name
       FROM encounters e
       JOIN users u ON e.doctor_id = u.user_id
       WHERE e.patient_id = $1
       ORDER BY e.created_at DESC`,
      [patientId]
    );
    encounters = encountersRes.rows;

    for (const enc of encounters) {
      try {
        const diagnosesRes = await query(
          `SELECT * FROM diagnoses WHERE encounter_id = $1 ORDER BY is_primary DESC`,
          [enc.encounter_id]
        );
        enc.diagnoses = diagnosesRes.rows;
      } catch {
        enc.diagnoses = [];
      }
    }
  } catch (err) {
    console.warn('Encounters query skipped:', err);
    encounters = [];
  }

  // 3. Prescriptions & Active Meds (Fault tolerant)
  let prescriptions: any[] = [];
  const activeMedications: any[] = [];
  try {
    const rxRes = await query(
      `SELECT pr.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as doctor_name
       FROM prescriptions pr
       LEFT JOIN users u ON pr.doctor_id = u.user_id
       WHERE pr.patient_id = $1`,
      [patientId]
    );
    prescriptions = rxRes.rows;

    for (const rx of prescriptions) {
      try {
        const itemsRes = await query(
          `SELECT pi.*, COALESCE(i.name, pi.medication_name) as med_name
           FROM prescription_items pi
           LEFT JOIN inventory_items i ON pi.inventory_id = i.inventory_id
           WHERE pi.prescription_id = $1`,
          [rx.prescription_id]
        );
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
      } catch {
        rx.items = [];
      }
    }
  } catch (err) {
    console.warn('Prescriptions query skipped:', err);
    prescriptions = [];
  }

  // 4. Lab & Diagnostic Orders (Fault tolerant)
  let labOrders: any[] = [];
  try {
    const labOrdersRes = await query(
      `SELECT tor.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as doctor_name
       FROM test_orders tor
       LEFT JOIN users u ON tor.doctor_id = u.user_id
       WHERE tor.patient_id = $1`,
      [patientId]
    );
    labOrders = labOrdersRes.rows;

    for (const order of labOrders) {
      try {
        const orderItemsRes = await query(
          `SELECT toi.*, ds.name as test_name, ds.service_code, ds.sample_required,
                  dc.name as category_name
           FROM test_order_items toi
           LEFT JOIN diagnostic_services ds ON toi.service_id = ds.service_id
           LEFT JOIN diagnostic_categories dc ON ds.category_id = dc.category_id
           WHERE toi.order_id = $1`,
          [order.order_id]
        );
        order.items = orderItemsRes.rows;

        for (const item of order.items) {
          try {
            const resultsRes = await query(
              `SELECT lrp.*, lrp.parameter_name as name, lrp.actual_value as result_value,
                      lrp.reference_range as normal_range, lrp.unit
               FROM lab_result_parameters lrp
               WHERE lrp.order_item_id = $1
               ORDER BY lrp.created_at ASC`,
              [item.item_id]
            );
            item.results = resultsRes.rows;
          } catch {
            item.results = [];
          }
        }
      } catch {
        order.items = [];
      }
    }

    // Also include diagnostic test items & health packages from patient invoices
    try {
      const invLabItemsRes = await query(
        `SELECT i.invoice_id, i.invoice_number, i.created_at, ii.item_id, ii.description as test_name, ii.amount
         FROM invoices i
         JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
         WHERE i.patient_id = $1`,
        [patientId]
      );
      for (const invItem of invLabItemsRes.rows) {
        const desc = (invItem.test_name || '').toLowerCase();
        if (desc.includes('test') || desc.includes('profile') || desc.includes('cbc') || desc.includes('lft') || desc.includes('package') || desc.includes('health') || desc.includes('sugar') || desc.includes('lipid')) {
          const alreadyExists = labOrders.some(o => (o.items || []).some((it: any) => (it.test_name || '').toLowerCase() === desc));
          if (!alreadyExists) {
            labOrders.push({
              order_id: invItem.invoice_id,
              order_number: `INV-LAB-${invItem.invoice_number || invItem.invoice_id.substring(0, 6)}`,
              created_at: invItem.created_at,
              doctor_name: 'Dr. Sarah Jenkins',
              status: 'Completed',
              items: [{
                item_id: invItem.item_id,
                test_name: invItem.test_name,
                category_name: desc.includes('profile') || desc.includes('health') || desc.includes('package') ? 'Health Package' : 'Laboratory Test',
                status: 'Completed',
                results: []
              }]
            });
          }
        }
      }
    } catch (invErr) {
      console.warn('Invoice lab items query skipped:', invErr);
    }
  } catch (err) {
    console.warn('Lab orders query skipped:', err);
    labOrders = [];
  }

  // 5. Vitals History Series for Trend Graphing (Fault tolerant)
  let vitalsSeries: any[] = [];
  try {
    const vitalsSeriesRes = await query(
      `SELECT encounter_id, created_at as encounter_timestamp, systolic_bp, diastolic_bp, pulse_rate,
              temperature_celsius, weight_kg, spo2
       FROM encounters
       WHERE patient_id = $1`,
      [patientId]
    );
    vitalsSeries = vitalsSeriesRes.rows;
  } catch (err) {
    console.warn('Vitals query skipped:', err);
    vitalsSeries = [];
  }

  // 6. Upcoming Appointments (Fault tolerant)
  let upcomingAppointments: any[] = [];
  try {
    const appointmentsRes = await query(
      `SELECT a.*, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as doctor_name
       FROM appointments a
       LEFT JOIN users u ON a.doctor_id = u.user_id
       WHERE a.patient_id = $1`,
      [patientId]
    );
    upcomingAppointments = appointmentsRes.rows;
  } catch (err) {
    console.warn('Appointments query skipped:', err);
    upcomingAppointments = [];
  }

  let parsedVitalsHistory: any[] = [];
  if (patient.vitals_history) {
    if (typeof patient.vitals_history === 'string') {
      try { parsedVitalsHistory = JSON.parse(patient.vitals_history); } catch { parsedVitalsHistory = []; }
    } else if (Array.isArray(patient.vitals_history)) {
      parsedVitalsHistory = patient.vitals_history;
    }
  }

  let parsedCurrentVitals: any = {};
  if (patient.current_vitals) {
    if (typeof patient.current_vitals === 'string') {
      try { parsedCurrentVitals = JSON.parse(patient.current_vitals); } catch { parsedCurrentVitals = {}; }
    } else if (typeof patient.current_vitals === 'object') {
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
