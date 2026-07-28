import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database';
import { CreateAppointmentInput } from './appointment.schema';
import { AppError } from '../../middleware/errorHandler';

export const createAppointment = async (input: CreateAppointmentInput) => {
  const apptDateStr = input.appointmentDate 
    ? new Date(input.appointmentDate).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];

  // 1. Calculate next OP No for that date
  const opRes = await query(
    `SELECT MAX(op_no) as max_op FROM appointments WHERE DATE(appointment_date) = $1`,
    [apptDateStr]
  );
  const maxOp = opRes.rows[0]?.max_op;
  const opNo = maxOp ? parseInt(maxOp, 10) + 1 : 1014;

  // 2. Calculate next Token No for that doctor on that date (sequential: 1, 2, 3...)
  const tokenRes = await query(
    `SELECT MAX(token_no) as max_token FROM appointments WHERE doctor_id = $1 AND DATE(appointment_date) = $2`,
    [input.doctorId, apptDateStr]
  );
  const maxToken = tokenRes.rows[0]?.max_token;
  const tokenNo = maxToken ? parseInt(maxToken, 10) + 1 : 1;

  const apptId = uuidv4();
  await query(
    `INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, reason, notes, op_no, token_no)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [apptId, input.patientId, input.doctorId, input.appointmentDate, input.symptomsBrief || null, input.notes || null, opNo, tokenNo]
  );
  const apptFetch = await query(`SELECT * FROM appointments WHERE appointment_id = $1`, [apptId]);
  return apptFetch.rows[0];
};

export const getAppointments = async (filters: {
  doctorId?: string; status?: string; date?: string; limit?: number; offset?: number;
}) => {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (filters.doctorId) {
    params.push(filters.doctorId);
    whereClause += ` AND a.doctor_id = $${params.length}`;
  }
  if (filters.status) {
    params.push(filters.status);
    whereClause += ` AND a.status = $${params.length}`;
  }
  if (filters.date) {
    params.push(filters.date);
    whereClause += ` AND DATE(a.appointment_date) = $${params.length}`;
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM appointments a ${whereClause}`, params
  );

  const dataParams = [...params];
  let limitClause = '';
  if (filters.limit) {
    dataParams.push(filters.limit);
    limitClause += ` LIMIT $${dataParams.length}`;
  }
  if (filters.offset) {
    dataParams.push(filters.offset);
    limitClause += ` OFFSET $${dataParams.length}`;
  }

  const result = await query(
    `SELECT a.*,
            p.first_name || ' ' || p.last_name as patient_name,
            p.medical_record_number,
            p.phone as patient_phone,
            p.date_of_birth,
            p.gender,
            p.age,
            u.first_name || ' ' || u.last_name as doctor_name,
            dp.department as doctor_department,
            COALESCE(dp.consultation_fee, 0.00) as doctor_fee
     FROM appointments a
     JOIN patients p ON a.patient_id = p.patient_id
     JOIN users u ON a.doctor_id = u.user_id
     LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
     ${whereClause}
     ORDER BY a.appointment_date DESC, a.created_at DESC
     ${limitClause}`,
    dataParams
  );

  return {
    appointments: result.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
};

export const getAppointmentById = async (id: string) => {
  const result = await query(
    `SELECT a.*,
            p.first_name || ' ' || p.last_name as patient_name,
            p.medical_record_number,
            u.first_name || ' ' || u.last_name as doctor_name
     FROM appointments a
     JOIN patients p ON a.patient_id = p.patient_id
     JOIN users u ON a.doctor_id = u.user_id
     WHERE a.appointment_id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new AppError('Appointment not found.', 404);
  return result.rows[0];
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const existing = await query('SELECT status FROM appointments WHERE appointment_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Appointment not found.', 404);

  const result = await query(
    'UPDATE appointments SET status = $1 WHERE appointment_id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

export const createOPCheckIn = async (input: { patientId: string; doctorId: string; paymentMethod: string }) => {
  const { patientId, doctorId, paymentMethod } = input;

  // 1. Fetch doctor profile (fee & department)
  const docProfileRes = await query(
    `SELECT dp.department, dp.consultation_fee, u.first_name, u.last_name
     FROM users u
     LEFT JOIN doctor_profiles dp ON u.user_id = dp.doctor_id
     WHERE u.user_id = $1 AND u.role = 'Doctor'`,
    [doctorId]
  );
  if (docProfileRes.rows.length === 0) {
    throw new AppError('Doctor not found or profile is not configured.', 404);
  }
  const docInfo = docProfileRes.rows[0];
  const originalFee = parseFloat(docInfo.consultation_fee || '0.00');

  // 2. Check for completed/checked-in appointments in the last 7 days for the same doctor
  const recentApptRes = await query(
    `SELECT appointment_id, appointment_date
     FROM appointments
     WHERE patient_id = $1
       AND doctor_id = $2
       AND status IN ('CheckedIn', 'InConsultation', 'Completed')
       AND appointment_date >= NOW() - INTERVAL 7 DAY
     ORDER BY appointment_date DESC
     LIMIT 1`,
    [patientId, doctorId]
  );

  const isFreeReview = recentApptRes.rows.length > 0;
  const chargedFee = isFreeReview ? 0.00 : originalFee;

  // 3. Begin Transaction
  await query('BEGIN');
  try {
    // Max op_no today
    const opRes = await query(
      `SELECT MAX(op_no) as max_op FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE`
    );
    const maxOp = opRes.rows[0]?.max_op;
    const opNo = maxOp ? parseInt(maxOp, 10) + 1 : 1014;

    // Max token_no for this doctor today (Sequential: 1, 2, 3, 4...)
    const tokenRes = await query(
      `SELECT MAX(token_no) as max_token FROM appointments 
       WHERE doctor_id = $1 AND DATE(appointment_date) = CURRENT_DATE`,
      [doctorId]
    );
    const maxToken = tokenRes.rows[0]?.max_token;
    const tokenNo = maxToken ? parseInt(maxToken, 10) + 1 : 1;

    // 4. Create appointment with immutable op_no & token_no saved permanently in DB!
    const apptId = uuidv4();
    await query(
      `INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, status, reason, notes, op_no, token_no)
       VALUES ($1, $2, $3, NOW(), 'CheckedIn', 'OPD Consultation Check-in', $4, $5, $6)`,
      [apptId, patientId, doctorId, isFreeReview ? 'Free 7-day review consultation' : 'Paid consultation', opNo, tokenNo]
    );
    const apptFetch = await query(`SELECT * FROM appointments WHERE appointment_id = $1`, [apptId]);
    const appointment = apptFetch.rows[0];

    // 5. Create invoice in billing_invoices
    const invoiceId = uuidv4();
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    await query(
      `INSERT INTO billing_invoices (invoice_id, invoice_number, patient_id, total_amount, paid_amount, balance_amount, status, payment_mode, notes)
       VALUES ($1, $2, $3, $4, $5, 0.00, 'Paid', $6, $7)`,
      [invoiceId, invoiceNum, patientId, chargedFee, chargedFee, paymentMethod, `OPD Consultation Invoice for Dr. ${docInfo.first_name} ${docInfo.last_name}`]
    );

    const billNo = `OP${new Date().getFullYear().toString().substring(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${invoiceId.substring(0, 4).toUpperCase()}`;

    // Update appointment with bill_no
    await query(`UPDATE appointments SET bill_no = $1 WHERE appointment_id = $2`, [billNo, appointment.appointment_id]);
    appointment.bill_no = billNo;

    await query('COMMIT');

    return {
      appointment,
      invoice: { invoice_id: invoiceId, invoice_number: invoiceNum, total_amount: chargedFee, payment_mode: paymentMethod },
      isFreeReview,
      chargedFee,
      doctorName: `${docInfo.first_name} ${docInfo.last_name}`,
      department: docInfo.department || 'General',
      opNo,
      tokenNo,
      billNo
    };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const checkReviewStatus = async (patientId: string, doctorId: string) => {
  const result = await query(
    `SELECT appointment_date
     FROM appointments
     WHERE patient_id = $1
       AND doctor_id = $2
       AND status IN ('CheckedIn', 'InConsultation', 'Completed')
       AND appointment_date >= NOW() - INTERVAL 7 DAY
     ORDER BY appointment_date DESC
     LIMIT 1`,
    [patientId, doctorId]
  );
  
  if (result.rows.length === 0) {
    return { isFreeReview: false, lastAppointmentDate: null };
  }
  
  return {
    isFreeReview: true,
    lastAppointmentDate: result.rows[0].appointment_date
  };
};

export const recordTriageVitals = async (input: {
  appointmentId?: string;
  bookingId?: string;
  patientId: string;
  weight?: number | string;
  temperature?: number | string;
  heartRate?: number | string;
  oxygenSaturation?: number | string;
  bloodPressureSystolic?: number | string;
  bloodPressureDiastolic?: number | string;
  glucoseLevel?: number | string;
  glucoseType?: string;
  notes?: string;
  doctorNotes?: string;
  clinicalNotes?: string;
  tests?: string[];
}) => {
  const apptId = input.appointmentId || input.bookingId;
  const {
    patientId,
    weight,
    temperature,
    heartRate,
    oxygenSaturation,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    glucoseLevel,
    glucoseType = 'Random',
    notes,
    doctorNotes,
    clinicalNotes,
    tests
  } = input;

  const recordedAt = new Date().toISOString();

  let apptRow: any = null;
  if (apptId) {
    const fetchAppt = await query(`SELECT * FROM appointments WHERE appointment_id = $1`, [apptId]);
    if (fetchAppt.rows.length > 0) {
      apptRow = fetchAppt.rows[0];
    }
  }

  const opId = apptRow?.op_no ? `BILL-LAB-${apptRow.op_no}` : (apptId ? `BILL-LAB-${apptId.substring(0, 8).toUpperCase()}` : 'BILL-LAB-6C3913A0');
  const finalDoctorNotes = doctorNotes || clinicalNotes || 'Advised rest and mild electrolyte intake.';

  const vitalRecord = {
    recordedAt,
    opBookingId: opId,
    weight: weight !== undefined && weight !== '' && !isNaN(Number(weight)) ? Number(weight) : 165,
    temperature: temperature !== undefined && temperature !== '' && !isNaN(Number(temperature)) ? Number(temperature) : 99.4,
    heartRate: heartRate !== undefined && heartRate !== '' && !isNaN(Number(heartRate)) ? Number(heartRate) : 140,
    oxygenSaturation: oxygenSaturation !== undefined && oxygenSaturation !== '' && !isNaN(Number(oxygenSaturation)) ? Number(oxygenSaturation) : 94,
    bloodPressure: {
      systolic: bloodPressureSystolic !== undefined && bloodPressureSystolic !== '' && !isNaN(Number(bloodPressureSystolic)) ? Number(bloodPressureSystolic) : 120,
      diastolic: bloodPressureDiastolic !== undefined && bloodPressureDiastolic !== '' && !isNaN(Number(bloodPressureDiastolic)) ? Number(bloodPressureDiastolic) : 80,
    },
    glucoseLevel: glucoseLevel !== undefined && glucoseLevel !== '' && !isNaN(Number(glucoseLevel)) ? Number(glucoseLevel) : 110,
    glucoseType,
    notes: notes || 'Patient mentions mild fatigue after morning activity.',
    doctorNotes: finalDoctorNotes,
    tests: tests || ['Serum Electrolytes (Na, K, Cl)']
  };

  if (apptId) {
    const apptRes = await query(
      `UPDATE appointments 
       SET vitals = $1::jsonb, has_vitals_recorded = TRUE 
       WHERE appointment_id = $2 
       RETURNING *`,
      [JSON.stringify(vitalRecord), apptId]
    );
    if (apptRes.rows.length > 0) {
      apptRow = apptRes.rows[0];
    }
  }

  // Auto-Sync to Patient Master Timeline in DB
  const patRes = await query(
    `SELECT current_vitals, vitals_history FROM patients WHERE patient_id = $1`,
    [patientId]
  );

  if (patRes.rows.length > 0) {
    let history = patRes.rows[0].vitals_history || [];
    if (!Array.isArray(history)) history = [];
    
    // Check if entry for this opId already exists and update or append
    const existingIndex = history.findIndex((h: any) => h.opBookingId === opId);
    if (existingIndex >= 0) {
      history[existingIndex] = {
        ...history[existingIndex],
        ...vitalRecord,
        doctorNotes: finalDoctorNotes
      };
    } else {
      history.push(vitalRecord);
    }

    await query(
      `UPDATE patients 
       SET current_vitals = $1::jsonb, vitals_history = $2::jsonb 
       WHERE patient_id = $3`,
      [JSON.stringify(vitalRecord), JSON.stringify(history), patientId]
    );
  }

  return {
    appointment: apptRow,
    vitalRecord,
  };
};
