import { query } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { generateAndUploadQrCode } from '../../utils/s3Upload';
import { v4 as uuidv4 } from 'uuid';

// 1. Dashboard Statistics
export const getDashboardStats = async () => {
  const today = new Date().toISOString().split('T')[0];

  // Total Orders today
  const ordersToday = await query(
    `SELECT COUNT(*) as count FROM test_orders WHERE DATE(created_at) = $1`, 
    [today]
  );

  // Pending Samples count
  const pendingSamples = await query(
    `SELECT COUNT(*) as count FROM test_order_items 
     WHERE status = 'Ordered' AND service_id IN (SELECT service_id FROM diagnostic_services WHERE sample_required IS NOT NULL AND sample_required != 'None')`
  );

  // Collected Samples count
  const collectedSamples = await query(
    `SELECT COUNT(*) as count FROM test_order_items WHERE status = 'SampleCollected'`
  );

  // Running/Processing Tests count
  const processingTests = await query(
    `SELECT COUNT(*) as count FROM test_order_items WHERE status = 'Processing'`
  );

  // Completed & Verified Reports count
  const completedReports = await query(
    `SELECT COUNT(*) as count FROM test_order_items WHERE status = 'Completed' OR status = 'Verified'`
  );

  // Pending Doctor Verification count
  const pendingVerification = await query(
    `SELECT COUNT(*) as count FROM test_order_items WHERE status = 'Resulted'`
  );

  // Today's Revenue
  const revenueToday = await query(
    `SELECT COALESCE(SUM(total_amount), 0) as total FROM diagnostic_billing WHERE DATE(created_at) = $1`,
    [today]
  );

  // Emergency Cases count
  const emergencyCases = await query(
    `SELECT COUNT(*) as count FROM test_orders WHERE priority = 'Emergency' AND DATE(created_at) = $1`,
    [today]
  );

  // Daily Test Volume Chart Data (last 7 days)
  const volumeChart = await query(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM test_orders 
    GROUP BY DATE(created_at) 
    ORDER BY DATE(created_at) DESC 
    LIMIT 7
  `);

  // Department-wise breakdown
  const deptBreakdown = await query(`
    SELECT c.name as department, COUNT(toi.item_id) as count
    FROM test_order_items toi
    JOIN diagnostic_services s ON toi.service_id = s.service_id
    JOIN diagnostic_categories c ON s.category_id = c.category_id
    GROUP BY c.name
  `);

  return {
    todayOrders: parseInt(ordersToday.rows[0].count || '0'),
    pendingSamples: parseInt(pendingSamples.rows[0].count || '0'),
    collectedSamples: parseInt(collectedSamples.rows[0].count || '0'),
    runningTests: parseInt(processingTests.rows[0].count || '0'),
    completedReports: parseInt(completedReports.rows[0].count || '0'),
    pendingVerification: parseInt(pendingVerification.rows[0].count || '0'),
    todayRevenue: parseFloat(revenueToday.rows[0].total || '0'),
    emergencyCases: parseInt(emergencyCases.rows[0].count || '0'),
    charts: {
      volume: volumeChart.rows.reverse(),
      departments: deptBreakdown.rows
    }
  };
};

// 2. Diagnostic Categories
export const getCategories = async () => {
  const result = await query('SELECT * FROM diagnostic_categories ORDER BY name');
  return result.rows;
};

// 3. Diagnostic Services (Catalog)
export const getServices = async () => {
  const servicesRes = await query(`
    SELECT s.*, 
           COALESCE(c.name, d.department_name, 'General') as category_name
    FROM diagnostic_services s
    LEFT JOIN diagnostic_categories c ON s.category_id COLLATE utf8mb4_general_ci = c.category_id COLLATE utf8mb4_general_ci
    LEFT JOIN departments d ON (s.category_id COLLATE utf8mb4_general_ci = d.department_id COLLATE utf8mb4_general_ci OR s.category_id COLLATE utf8mb4_general_ci = CONCAT('dept-', d.department_id) COLLATE utf8mb4_general_ci)
    ORDER BY s.name
  `);

  const services = servicesRes.rows;
  if (services.length === 0) return [];

  const paramsRes = await query(`
    SELECT * FROM diagnostic_parameters ORDER BY display_order ASC
  `);

  const paramsByService: Record<string, any[]> = {};
  for (const p of paramsRes.rows) {
    if (!paramsByService[p.service_id]) paramsByService[p.service_id] = [];
    paramsByService[p.service_id].push({
      parameter_id: p.parameter_id,
      name: p.name,
      unit: p.unit,
      reference_range: p.reference_range,
      display_order: p.display_order,
      input_type: p.input_type,
      dropdown_options: p.dropdown_options,
      min_value: p.min_value,
      max_value: p.max_value,
      age_group: p.age_group,
      gender: p.gender,
      ref_min_male: p.ref_min_male,
      ref_max_male: p.ref_max_male,
      ref_min_female: p.ref_min_female,
      ref_max_female: p.ref_max_female,
      ref_min_child: p.ref_min_child,
      ref_max_child: p.ref_max_child,
      row_type: p.row_type || 'parameter'
    });
  }

  return services.map(s => ({
    ...s,
    parameters: paramsByService[s.service_id] || []
  }));
};

export const addService = async (input: any) => {
  await query('BEGIN');
  try {
    const serviceId = uuidv4();
    await query(`
      INSERT INTO diagnostic_services 
      (service_id, name, category_id, service_code, price, gst_percentage, duration_minutes, sample_required, normal_range, machine_required, home_collection_available, emergency_available, is_active, report_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      serviceId,
      input.name, input.categoryId, (input.serviceCode || '').toUpperCase(), input.price, input.gstPercentage || 0,
      input.durationMinutes || 30, input.sampleRequired || 'None', input.normalRange || '', input.machineRequired || '',
      input.homeCollectionAvailable || false, input.emergencyAvailable || false, input.isActive !== false, input.reportType || 'Structured'
    ]);

    if (input.parameters && Array.isArray(input.parameters)) {
      for (let i = 0; i < input.parameters.length; i++) {
        const p = input.parameters[i];
        if (p.name && p.name.trim()) {
          const paramId = uuidv4();
          const refRange = p.referenceRange !== undefined ? p.referenceRange : (p.reference_range !== undefined ? p.reference_range : '');
          const inputType = p.inputType || p.input_type || 'Number';
          const dropdownOptions = p.dropdownOptions !== undefined ? p.dropdownOptions : (p.dropdown_options !== undefined ? p.dropdown_options : null);
          const rowType = p.rowType || p.row_type || 'parameter';

          const getVal = (v: any) => {
            if (v === null || v === undefined || v === '') return null;
            return v.toString().trim();
          };

          await query(`
            INSERT INTO diagnostic_parameters (
              parameter_id, service_id, name, unit, reference_range, display_order, input_type, dropdown_options, 
              min_value, max_value, age_group, gender,
              ref_min_male, ref_max_male, ref_min_female, ref_max_female, ref_min_child, ref_max_child, row_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          `, [
            paramId,
            serviceId, 
            p.name.trim(), 
            p.unit !== undefined ? p.unit : (p.unit_name || ''), 
            refRange, 
            i + 1,
            inputType,
            dropdownOptions,
            getVal(p.minValue),
            getVal(p.maxValue),
            p.ageGroup || p.age_group || 'Universal',
            p.gender || 'Universal',
            getVal(p.refMinMale),
            getVal(p.refMaxMale),
            getVal(p.refMinFemale),
            getVal(p.refMaxFemale),
            getVal(p.refMinChild),
            getVal(p.refMaxChild),
            rowType
          ]);
        }
      }
    }

    await query('COMMIT');
    const servFetch = await query('SELECT * FROM diagnostic_services WHERE service_id = $1', [serviceId]);
    return servFetch.rows[0];
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
};

export const editService = async (serviceId: string, input: any) => {
  await query('BEGIN');
  try {
    await query(`
      UPDATE diagnostic_services 
      SET name = $1, category_id = $2, service_code = $3, price = $4, gst_percentage = $5, 
          duration_minutes = $6, sample_required = $7, normal_range = $8, machine_required = $9, 
          home_collection_available = $10, emergency_available = $11, is_active = $12, report_type = $13
      WHERE service_id = $14
    `, [
      input.name, input.categoryId, (input.serviceCode || '').toUpperCase(), input.price, input.gstPercentage || 0,
      input.durationMinutes || 30, input.sampleRequired || 'None', input.normalRange || '', input.machineRequired || '',
      input.homeCollectionAvailable || false, input.emergencyAvailable || false, input.isActive !== false, input.reportType || 'Structured', serviceId
    ]);

    if (input.parameters && Array.isArray(input.parameters)) {
      await query('DELETE FROM diagnostic_parameters WHERE service_id = $1', [serviceId]);
      for (let i = 0; i < input.parameters.length; i++) {
        const p = input.parameters[i];
        if (p.name && p.name.trim()) {
          const paramId = uuidv4();
          const refRange = p.referenceRange !== undefined ? p.referenceRange : (p.reference_range !== undefined ? p.reference_range : '');
          const inputType = p.inputType || p.input_type || 'Number';
          const dropdownOptions = p.dropdownOptions !== undefined ? p.dropdownOptions : (p.dropdown_options !== undefined ? p.dropdown_options : null);
          const rowType = p.rowType || p.row_type || 'parameter';

          const getVal = (v: any) => {
            if (v === null || v === undefined || v === '') return null;
            return v.toString().trim();
          };

          await query(`
            INSERT INTO diagnostic_parameters (
              parameter_id, service_id, name, unit, reference_range, display_order, input_type, dropdown_options, 
              min_value, max_value, age_group, gender,
              ref_min_male, ref_max_male, ref_min_female, ref_max_female, ref_min_child, ref_max_child, row_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          `, [
            paramId,
            serviceId, 
            p.name.trim(), 
            p.unit !== undefined ? p.unit : (p.unit_name || ''), 
            refRange, 
            i + 1,
            inputType,
            dropdownOptions,
            getVal(p.minValue),
            getVal(p.maxValue),
            p.ageGroup || p.age_group || 'Universal',
            p.gender || 'Universal',
            getVal(p.refMinMale),
            getVal(p.refMaxMale),
            getVal(p.refMinFemale),
            getVal(p.refMaxFemale),
            getVal(p.refMinChild),
            getVal(p.refMaxChild),
            rowType
          ]);
        }
      }
    }

    await query('COMMIT');
    const servFetch = await query('SELECT * FROM diagnostic_services WHERE service_id = $1', [serviceId]);
    return servFetch.rows[0];
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
};

export const deleteService = async (serviceId: string) => {
  await query('DELETE FROM diagnostic_package_items WHERE service_id = $1', [serviceId]);
  await query('DELETE FROM diagnostic_parameters WHERE service_id = $1', [serviceId]);
  await query('UPDATE test_order_items SET service_id = NULL WHERE service_id = $1', [serviceId]);
  await query('DELETE FROM diagnostic_services WHERE service_id = $1', [serviceId]);
  return { success: true };
};

// 4. Packages
export const getPackages = async () => {
  const pkgsRes = await query(`SELECT * FROM diagnostic_packages ORDER BY name ASC`);
  const pkgs = pkgsRes.rows;
  if (pkgs.length === 0) return [];

  const itemsRes = await query(`
    SELECT dpi.package_id, s.service_id, s.name, s.service_code, s.price, s.sample_required, s.normal_range
    FROM diagnostic_package_items dpi
    JOIN diagnostic_services s ON dpi.service_id COLLATE utf8mb4_general_ci = s.service_id COLLATE utf8mb4_general_ci
  `);

  const servicesByPackage: Record<string, any[]> = {};
  for (const item of itemsRes.rows) {
    if (!servicesByPackage[item.package_id]) servicesByPackage[item.package_id] = [];
    servicesByPackage[item.package_id].push({
      service_id: item.service_id,
      name: item.name,
      service_code: item.service_code,
      price: item.price,
      sample_required: item.sample_required,
      normal_range: item.normal_range
    });
  }

  return pkgs.map(p => ({
    ...p,
    services: servicesByPackage[p.package_id] || []
  }));
};

export const addPackage = async (input: any) => {
  await query('BEGIN');
  try {
    const packageId = uuidv4();
    await query(`
      INSERT INTO diagnostic_packages (package_id, name, price, discount, validity_days, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
    `, [packageId, input.name, input.price, input.discount || 0, input.validityDays || 365]);

    if (input.services && Array.isArray(input.services)) {
      for (const serviceId of input.services) {
        const itemId = uuidv4();
        await query(`
          INSERT INTO diagnostic_package_items (id, package_id, service_id)
          VALUES ($1, $2, $3)
        `, [itemId, packageId, serviceId]);
      }
    }

    await query('COMMIT');
    const pkgRes = await query('SELECT * FROM diagnostic_packages WHERE package_id = $1', [packageId]);
    return pkgRes.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const editPackage = async (packageId: string, input: any) => {
  await query('BEGIN');
  try {
    await query(`
      UPDATE diagnostic_packages 
      SET name = $1, price = $2, discount = $3, validity_days = $4
      WHERE package_id = $5
    `, [input.name, input.price, input.discount || 0, input.validityDays || 365, packageId]);

    await query('DELETE FROM diagnostic_package_items WHERE package_id = $1', [packageId]);

    if (input.services && Array.isArray(input.services)) {
      for (const serviceId of input.services) {
        const itemId = uuidv4();
        await query(`
          INSERT INTO diagnostic_package_items (id, package_id, service_id)
          VALUES ($1, $2, $3)
        `, [itemId, packageId, serviceId]);
      }
    }

    await query('COMMIT');
    return { success: true };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const deletePackage = async (packageId: string) => {
  await query('BEGIN');
  try {
    await query('DELETE FROM diagnostic_package_items WHERE package_id = $1', [packageId]);
    await query('DELETE FROM diagnostic_packages WHERE package_id = $1', [packageId]);
    await query('COMMIT');
    return { success: true };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 5. Test Orders
export const getOrders = async () => {
  const result = await query(`
    SELECT o.*, p.first_name, p.last_name, p.medical_record_number, p.phone as patient_phone, 
           p.gender as patient_gender, p.gender as gender, 
           p.date_of_birth as patient_birth_date, p.date_of_birth as birth_date, 
           p.age as patient_age, p.age as age,
           u.first_name as doc_first, u.last_name as doc_last,
           rd.name as referral_name,
           (
             SELECT json_agg(json_build_object(
               'item_id', toi.item_id,
               'service_id', toi.service_id,
               'package_id', toi.package_id,
               'package_name', (SELECT dp.name FROM diagnostic_packages dp WHERE dp.package_id = toi.package_id),
               'service_name', ds.name,
               'service_code', ds.service_code,
               'category_name', c.name,
               'sample_required', ds.sample_required,
               'normal_range', ds.normal_range,
               'price', ds.price,
               'report_type', ds.report_type,
               'status', toi.status,
               'correction_required', toi.correction_required,
               'sample', (SELECT json_build_object('sample_id', sc.sample_id, 'container_type', sc.container_type, 'barcode', sc.barcode, 'status', sc.status) FROM sample_collections sc WHERE sc.order_item_id = toi.item_id LIMIT 1),
               'lab_result', (SELECT row_to_json(lr) FROM lab_results lr WHERE lr.order_item_id = toi.item_id LIMIT 1),
               'radiology_report', (SELECT row_to_json(rr) FROM radiology_reports rr WHERE rr.order_item_id = toi.item_id LIMIT 1),
               'ultrasound_report', (SELECT row_to_json(ur) FROM ultrasound_reports ur WHERE ur.order_item_id = toi.item_id LIMIT 1),
               'ecg_report', (SELECT row_to_json(er) FROM ecg_reports er WHERE er.order_item_id = toi.item_id LIMIT 1),
               'verification', (SELECT row_to_json(rv) FROM report_verifications rv WHERE rv.order_item_id = toi.item_id LIMIT 1),
               'parameters', (
                 SELECT json_agg(json_build_object(
                   'parameter_id', dp.parameter_id,
                   'name', dp.name,
                   'unit', dp.unit,
                   'reference_range', dp.reference_range,
                   'input_type', dp.input_type,
                   'dropdown_options', dp.dropdown_options,
                   'min_value', dp.min_value,
                   'max_value', dp.max_value,
                   'age_group', dp.age_group,
                   'gender', dp.gender,
                   'ref_min_male', dp.ref_min_male,
                   'ref_max_male', dp.ref_max_male,
                   'ref_min_female', dp.ref_min_female,
                   'ref_max_female', dp.ref_max_female,
                   'ref_min_child', dp.ref_min_child,
                   'ref_max_child', dp.ref_max_child,
                   'row_type', dp.row_type
                 ) ORDER BY dp.display_order)
                 FROM diagnostic_parameters dp 
                 WHERE dp.service_id = toi.service_id
               ),
               'result_parameters', (
                 SELECT json_agg(json_build_object(
                   'result_parameter_id', lrp.result_parameter_id,
                   'parameter_id', lrp.parameter_id,
                   'name', lrp.parameter_name,
                   'unit', lrp.unit,
                   'reference_range', lrp.reference_range,
                   'actual_value', lrp.actual_value,
                   'status', lrp.status
                 ) ORDER BY lrp.created_at)
                 FROM lab_result_parameters lrp
                 WHERE lrp.order_item_id = toi.item_id
               )
             ))
             FROM test_order_items toi
             JOIN diagnostic_services ds ON toi.service_id = ds.service_id
             JOIN diagnostic_categories c ON ds.category_id = c.category_id
             WHERE toi.order_id = o.order_id
           ) as items
    FROM test_orders o
    JOIN patients p ON o.patient_id = p.patient_id
    JOIN users u ON o.doctor_id = u.user_id
    LEFT JOIN referral_doctors rd ON o.referral_id = rd.referral_id
    ORDER BY o.created_at DESC
  `);

  const frontendUrl = process.env.FRONTEND_URL || 'https://hms-simon518.vercel.app';

  return result.rows.map((o) => {
    if (o.items && Array.isArray(o.items)) {
      o.items = o.items.map((item: any) => {
        const cleanId = (item.item_id || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
        const supabaseUrl = process.env.SUPABASE_URL || 'https://ctrlsyhzszlufdnguerz.supabase.co';
        const s3QrUrl = `${supabaseUrl}/storage/v1/object/public/logos/qr_${cleanId}.png`;
        const verifyUrl = `${frontendUrl}/verify/reports/${item.item_id}`;

        // Trigger S3 QR code upload asynchronously
        generateAndUploadQrCode(verifyUrl, item.item_id).catch(() => {});

        return {
          ...item,
          qr_code_url: s3QrUrl
        };
      });
    }
    return o;
  });
};

export const createOrder = async (input: any) => {
  await query('BEGIN');
  try {
    // Generate order number
    const orderNum = `LAB-${Date.now()}`;

    // 1. Create order
    const orderRes = await query(`
      INSERT INTO test_orders (order_number, patient_id, doctor_id, referral_id, priority, clinical_notes, diagnosis, payment_status, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Unpaid', 'Ordered')
      RETURNING *
    `, [orderNum, input.patientId, input.doctorId, input.referralId || null, input.priority, input.clinicalNotes || '', input.diagnosis || '']);

    const orderId = orderRes.rows[0].order_id;
    let subtotal = 0.00;

    // 2. Add services items
    for (const serviceId of input.services) {
      const sRes = await query('SELECT price, gst_percentage FROM diagnostic_services WHERE service_id = $1', [serviceId]);
      if (sRes.rows.length > 0) {
        subtotal += parseFloat(sRes.rows[0].price);
      }
      await query(`
        INSERT INTO test_order_items (order_id, service_id, status)
        VALUES ($1, $2, 'Ordered')
      `, [orderId, serviceId]);
    }

    // 3. Add packages items if any
    if (input.packages && input.packages.length > 0) {
      for (const packageId of input.packages) {
        const pRes = await query('SELECT price FROM diagnostic_packages WHERE package_id = $1', [packageId]);
        if (pRes.rows.length > 0) {
          subtotal += parseFloat(pRes.rows[0].price);
        }
        // Fetch services in package
        const pServices = await query('SELECT service_id FROM diagnostic_package_items WHERE package_id = $1', [packageId]);
        for (const ps of pServices.rows) {
          await query(`
            INSERT INTO test_order_items (order_id, service_id, package_id, status)
            VALUES ($1, $2, $3, 'Ordered')
          `, [orderId, ps.service_id, packageId]);
        }
      }
    }

    // Calculate billing
    const gst = subtotal * 0.18;
    const totalAmount = subtotal + gst;

    // Calculate Referral Doctor commission if any
    let commissionAmount = 0.00;
    if (input.referralId) {
      const refRes = await query('SELECT commission_percentage FROM referral_doctors WHERE referral_id = $1', [input.referralId]);
      if (refRes.rows.length > 0) {
        const commPct = parseFloat(refRes.rows[0].commission_percentage);
        commissionAmount = subtotal * (commPct / 100);
      }
    }

    // 4. Create invoice
    await query(`
      INSERT INTO diagnostic_billing (order_id, subtotal, discount, gst, total_amount, referral_commission_amount)
      VALUES ($1, $2, 0.00, $3, $4, $5)
    `, [orderId, subtotal, gst, totalAmount, commissionAmount]);

    await query('COMMIT');
    return { ...orderRes.rows[0], totalAmount };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const payOrder = async (orderId: string) => {
  await query(`UPDATE test_orders SET payment_status = 'Paid' WHERE order_id = $1`, [orderId]);
  return { success: true };
};

// 6. Sample Collection
export const collectSample = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    // Insert collection
    const result = await query(`
      INSERT INTO sample_collections (order_item_id, collected_by, container_type, barcode, status, remarks)
      VALUES ($1, $2, $3, $4, 'Collected', $5)
      RETURNING *
    `, [input.itemId, userId, input.containerType, input.barcode, input.remarks || '']);

    // Update item status
    await query(`UPDATE test_order_items SET status = 'SampleCollected' WHERE item_id = $1`, [input.itemId]);

    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 7. Results Submissions
export const submitLabResult = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const result = await query(`
      INSERT INTO lab_results (order_item_id, entered_by, actual_result, reference_range, status, machine_reading, remarks, machine_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [input.itemId, userId, input.actualResult || 'Multiple Values', input.referenceRange || '', input.status, input.machineReading || '', input.remarks || '', input.machineId || null]);

    if (input.parameters && Array.isArray(input.parameters)) {
      await query(`DELETE FROM lab_result_parameters WHERE order_item_id = $1`, [input.itemId]);
      for (const p of input.parameters) {
        await query(
          `INSERT INTO lab_result_parameters (order_item_id, parameter_id, parameter_name, unit, reference_range, actual_value, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            input.itemId, 
            p.parameter_id || p.parameterId || null, 
            p.name || p.parameterName, 
            p.unit || '', 
            p.reference_range || p.referenceRange || '', 
            p.actual_value || p.actualValue || '', 
            p.status || 'Normal'
          ]
        );
      }
    }

    await query(`UPDATE test_order_items SET status = 'Resulted', correction_required = FALSE WHERE item_id = $1`, [input.itemId]);
    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const submitRadiologyReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const result = await query(`
      INSERT INTO radiology_reports (order_item_id, radiographer_id, radiologist_id, image_urls, findings, impression, conclusion)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [input.itemId, userId, input.radiologistId || userId, input.imageUrls || [], input.findings, input.impression, input.conclusion || '']);

    await query(`UPDATE test_order_items SET status = 'Resulted', correction_required = FALSE WHERE item_id = $1`, [input.itemId]);
    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const submitUltrasoundReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const result = await query(`
      INSERT INTO ultrasound_reports (order_item_id, sonologist_id, clinical_history, findings, impression, recommendations)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [input.itemId, input.sonologistId || userId, input.clinicalHistory || '', input.findings, input.impression, input.recommendations || '']);

    await query(`UPDATE test_order_items SET status = 'Resulted', correction_required = FALSE WHERE item_id = $1`, [input.itemId]);
    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const submitEcgReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const result = await query(`
      INSERT INTO ecg_reports (order_item_id, operator_id, doctor_id, graph_url, findings, interpretation, recommendation)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [input.itemId, userId, input.doctorId || userId, input.graphUrl || '', input.findings, input.interpretation, input.recommendation || '']);

    if (input.parameters && Array.isArray(input.parameters)) {
      await query(`DELETE FROM lab_result_parameters WHERE order_item_id = $1`, [input.itemId]);
      for (const p of input.parameters) {
        await query(
          `INSERT INTO lab_result_parameters (order_item_id, parameter_id, parameter_name, unit, reference_range, actual_value, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            input.itemId, 
            p.parameter_id || p.parameterId || null, 
            p.name || p.parameterName, 
            p.unit || '', 
            p.reference_range || p.referenceRange || '', 
            p.actual_value || p.actualValue || '', 
            p.status || 'Normal'
          ]
        );
      }
    }

    await query(`UPDATE test_order_items SET status = 'Resulted', correction_required = FALSE WHERE item_id = $1`, [input.itemId]);
    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 8. Verification (Approve / Reject)
export const verifyReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const result = await query(`
      INSERT INTO report_verifications (order_item_id, verified_by, digital_signature_used, status, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [input.itemId, userId, input.digitalSignatureUsed || 'Verified digitally', input.status, input.notes || '']);

    let finalStatus = 'Ordered';
    let correctionRequired = false;

    if (input.status === 'Approved') {
      finalStatus = 'Verified';
    } else if (input.status === 'Correction') {
      correctionRequired = true;
      const itemRes = await query(`
        SELECT ds.sample_required 
        FROM test_order_items toi
        JOIN diagnostic_services ds ON toi.service_id = ds.service_id
        WHERE toi.item_id = $1
      `, [input.itemId]);
      const sampleReq = itemRes.rows[0]?.sample_required;
      const requiresSample = sampleReq && sampleReq !== 'None' && sampleReq !== '';
      finalStatus = requiresSample ? 'SampleCollected' : 'Ordered';
    }

    await query(`UPDATE test_order_items SET status = $1, correction_required = $2 WHERE item_id = $3`, [finalStatus, correctionRequired, input.itemId]);
    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 9. Machines
export const getMachines = async () => {
  const result = await query('SELECT * FROM machines ORDER BY name');
  return result.rows;
};

export const addMachine = async (input: any) => {
  const result = await query(`
    INSERT INTO machines (name, manufacturer, model, serial_number, calibration_date, maintenance_date, department, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    input.name, input.manufacturer || '', input.model || '', input.serialNumber,
    input.calibrationDate || null, input.maintenanceDate || null, input.department || 'Laboratory', input.status
  ]);
  return result.rows[0];
};

// 10. Referral Doctors
export const getReferrals = async () => {
  const result = await query('SELECT * FROM referral_doctors ORDER BY name');
  return result.rows;
};

export const addReferral = async (input: any) => {
  const result = await query(`
    INSERT INTO referral_doctors (name, hospital, commission_percentage, phone, email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [input.name, input.hospital || '', input.commissionPercentage, input.phone || '', input.email || '']);
  return result.rows[0];
};

// 11. Quality Control Logs
export const getQcLogs = async () => {
  const result = await query(`
    SELECT qc.*, m.name as machine_name, u.first_name, u.last_name
    FROM quality_control_logs qc
    JOIN machines m ON qc.machine_id = m.machine_id
    LEFT JOIN users u ON qc.logged_by = u.user_id
    ORDER BY qc.created_at DESC
  `);
  return result.rows;
};

export const addQcLog = async (input: any, userId: string) => {
  const result = await query(`
    INSERT INTO quality_control_logs (machine_id, qc_parameter, expected_value, actual_value, status, logged_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [input.machineId, input.qcParameter, input.expectedValue || '', input.actualValue || '', input.status, userId]);
  return result.rows[0];
};

export const updateOrderItemStatus = async (itemId: string, status: string) => {
  await query('UPDATE test_order_items SET status = $1 WHERE item_id = $2', [status, itemId]);
  
  const itemRes = await query('SELECT order_id FROM test_order_items WHERE item_id = $1', [itemId]);
  if (itemRes.rows.length > 0) {
    const orderId = itemRes.rows[0].order_id;
    const allItems = await query('SELECT status FROM test_order_items WHERE order_id = $1', [orderId]);
    const allCompleted = allItems.rows.every((i: any) => i.status === 'Completed' || i.status === 'Verified');
    const allCancelled = allItems.rows.every((i: any) => i.status === 'Cancelled');
    
    let newOrderStatus = 'Ordered';
    if (allCompleted) newOrderStatus = 'Completed';
    else if (allCancelled) newOrderStatus = 'Cancelled';
    else if (allItems.rows.some((i: any) => i.status !== 'Ordered')) newOrderStatus = 'Processing';
    
    await query('UPDATE test_orders SET status = $1 WHERE order_id = $2', [newOrderStatus, orderId]);
  }
  return { success: true };
};

export const getPublicReport = async (itemId: string) => {
  const result = await query(`
    SELECT 
      toi.item_id,
      toi.service_id,
      toi.package_id,
      (SELECT dp.name FROM diagnostic_packages dp WHERE dp.package_id = toi.package_id) as package_name,
      toi.status,
      toi.created_at,
      ds.name as service_name,
      ds.service_code,
      c.name as category_name,
      ds.sample_required,
      ds.normal_range,
      ds.price,
      o.order_number,
      o.created_at as order_created_at,
      p.first_name || ' ' || p.last_name AS patient_name,
      p.medical_record_number AS patient_mrn,
      p.gender,
      p.gender as patient_gender,
      p.date_of_birth as birth_date,
      p.date_of_birth as patient_birth_date,
      p.age,
      p.age as patient_age,
      p.phone as patient_phone,
      u.first_name as doc_first,
      u.last_name as doc_last,
      (SELECT row_to_json(lr) FROM lab_results lr WHERE lr.order_item_id = toi.item_id LIMIT 1) as lab_result,
      (SELECT row_to_json(rr) FROM radiology_reports rr WHERE rr.order_item_id = toi.item_id LIMIT 1) as radiology_report,
      (SELECT row_to_json(ur) FROM ultrasound_reports ur WHERE ur.order_item_id = toi.item_id LIMIT 1) as ultrasound_report,
      (SELECT row_to_json(er) FROM ecg_reports er WHERE er.order_item_id = toi.item_id LIMIT 1) as ecg_report,
      (SELECT row_to_json(rv) FROM report_verifications rv WHERE rv.order_item_id = toi.item_id LIMIT 1) as verification,
      (
        SELECT json_agg(json_build_object(
          'parameter_id', dp.parameter_id,
          'name', dp.name,
          'unit', dp.unit,
          'reference_range', dp.reference_range,
          'ref_min_male', dp.ref_min_male,
          'ref_max_male', dp.ref_max_male,
          'ref_min_female', dp.ref_min_female,
          'ref_max_female', dp.ref_max_female,
          'ref_min_child', dp.ref_min_child,
          'ref_max_child', dp.ref_max_child,
          'row_type', dp.row_type
        ) ORDER BY dp.display_order)
        FROM diagnostic_parameters dp
        WHERE dp.service_id = toi.service_id
      ) as parameters,
      (
        SELECT json_agg(json_build_object(
          'result_parameter_id', lrp.result_parameter_id,
          'parameter_id', lrp.parameter_id,
          'name', lrp.parameter_name,
          'unit', lrp.unit,
          'reference_range', lrp.reference_range,
          'actual_value', lrp.actual_value,
          'status', lrp.status
        ) ORDER BY lrp.created_at)
        FROM lab_result_parameters lrp
        WHERE lrp.order_item_id = toi.item_id
      ) as result_parameters
    FROM test_order_items toi
    JOIN test_orders o ON toi.order_id = o.order_id
    JOIN patients p ON o.patient_id = p.patient_id
    LEFT JOIN users u ON o.doctor_id = u.user_id
    JOIN diagnostic_services ds ON toi.service_id = ds.service_id
    JOIN diagnostic_categories c ON ds.category_id = c.category_id
    WHERE (toi.item_id::text = $1 OR o.order_id::text = $1 OR o.order_number = $1)
    ORDER BY toi.created_at DESC
    LIMIT 1
  `, [itemId]);

  if (result.rows.length === 0) return null;

  const item = result.rows[0];
  let packageItems: any[] = [];

  if (item.package_id) {
    const pkgItemsRes = await query(`
      SELECT 
        toi.item_id,
        toi.service_id,
        toi.package_id,
        (SELECT dp.name FROM diagnostic_packages dp WHERE dp.package_id = toi.package_id) as package_name,
        toi.status,
        toi.created_at,
        ds.name as service_name,
        ds.service_code,
        c.name as category_name,
        ds.sample_required,
        ds.normal_range,
        ds.price,
        (SELECT row_to_json(lr) FROM lab_results lr WHERE lr.order_item_id = toi.item_id LIMIT 1) as lab_result,
        (SELECT row_to_json(rr) FROM radiology_reports rr WHERE rr.order_item_id = toi.item_id LIMIT 1) as radiology_report,
        (SELECT row_to_json(ur) FROM ultrasound_reports ur WHERE ur.order_item_id = toi.item_id LIMIT 1) as ultrasound_report,
        (SELECT row_to_json(er) FROM ecg_reports er WHERE er.order_item_id = toi.item_id LIMIT 1) as ecg_report,
        (SELECT row_to_json(rv) FROM report_verifications rv WHERE rv.order_item_id = toi.item_id LIMIT 1) as verification,
        (
          SELECT json_agg(json_build_object(
            'parameter_id', dp.parameter_id,
            'name', dp.name,
            'unit', dp.unit,
            'reference_range', dp.reference_range,
            'ref_min_male', dp.ref_min_male,
            'ref_max_male', dp.ref_max_male,
            'ref_min_female', dp.ref_min_female,
            'ref_max_female', dp.ref_max_female,
            'ref_min_child', dp.ref_min_child,
            'ref_max_child', dp.ref_max_child,
            'row_type', dp.row_type
          ) ORDER BY dp.display_order)
          FROM diagnostic_parameters dp
          WHERE dp.service_id = toi.service_id
        ) as parameters,
        (
          SELECT json_agg(json_build_object(
            'result_parameter_id', lrp.result_parameter_id,
            'parameter_id', lrp.parameter_id,
            'name', lrp.parameter_name,
            'unit', lrp.unit,
            'reference_range', lrp.reference_range,
            'actual_value', lrp.actual_value,
            'status', lrp.status
          ) ORDER BY lrp.created_at)
          FROM lab_result_parameters lrp
          WHERE lrp.order_item_id = toi.item_id
        ) as result_parameters
      FROM test_order_items toi
      JOIN diagnostic_services ds ON toi.service_id = ds.service_id
      JOIN diagnostic_categories c ON ds.category_id = c.category_id
      WHERE toi.order_id = (SELECT order_id FROM test_order_items WHERE item_id::text = $1 OR order_id::text = $1 LIMIT 1)
        AND toi.package_id = $2
    `, [itemId, item.package_id]);
    packageItems = pkgItemsRes.rows;
  }

  const cleanId = (item.item_id || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ctrlsyhzszlufdnguerz.supabase.co';
  const s3QrUrl = `${supabaseUrl}/storage/v1/object/public/logos/qr_${cleanId}.png`;
  const frontendUrl = process.env.FRONTEND_URL || 'https://hms-simon518.vercel.app';
  const verifyUrl = `${frontendUrl}/verify/reports/${item.item_id}`;

  generateAndUploadQrCode(verifyUrl, item.item_id).catch(() => {});

  return {
    ...item,
    package_items: packageItems,
    qr_code_url: s3QrUrl
  };
};
