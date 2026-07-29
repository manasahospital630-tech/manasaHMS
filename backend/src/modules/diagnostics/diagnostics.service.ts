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
    `SELECT COUNT(*) as count FROM test_order_items toi
     JOIN diagnostic_services ds ON toi.service_id = ds.service_id COLLATE utf8mb4_general_ci
     WHERE toi.status = 'Ordered' AND ds.sample_required IS NOT NULL AND ds.sample_required != '' AND ds.sample_required != 'None'`
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
    `SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE DATE(created_at) = $1`,
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
    SELECT COALESCE(c.name, 'Diagnostics') as department, COUNT(toi.item_id) as count
    FROM test_order_items toi
    JOIN diagnostic_services s ON toi.service_id = s.service_id COLLATE utf8mb4_general_ci
    LEFT JOIN diagnostic_categories c ON s.category_id = c.category_id COLLATE utf8mb4_general_ci
    GROUP BY COALESCE(c.name, 'Diagnostics')
  `);

  return {
    todayOrders: parseInt(ordersToday.rows[0]?.count || '0'),
    pendingSamples: parseInt(pendingSamples.rows[0]?.count || '0'),
    collectedSamples: parseInt(collectedSamples.rows[0]?.count || '0'),
    runningTests: parseInt(processingTests.rows[0]?.count || '0'),
    completedReports: parseInt(completedReports.rows[0]?.count || '0'),
    pendingVerification: parseInt(pendingVerification.rows[0]?.count || '0'),
    todayRevenue: parseFloat(revenueToday.rows[0]?.total || '0'),
    emergencyCases: parseInt(emergencyCases.rows[0]?.count || '0'),
    charts: {
      volume: (volumeChart.rows || []).reverse(),
      departments: deptBreakdown.rows || []
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
  const ordersRes = await query(`
    SELECT o.*, 
           p.first_name, p.last_name, p.mrn as medical_record_number, p.phone as patient_phone, 
           p.gender as patient_gender, p.gender as gender, 
           p.date_of_birth as patient_birth_date, p.date_of_birth as birth_date,
           u.first_name as doc_first, u.last_name as doc_last,
           CASE WHEN ip.admission_id IS NOT NULL THEN 'IP' ELSE 'OP' END as patient_type,
           COALESCE(inv.due_amount, 0) as due_amount,
           inv.invoice_id
    FROM test_orders o
    JOIN patients p ON o.patient_id COLLATE utf8mb4_general_ci = p.patient_id COLLATE utf8mb4_general_ci
    LEFT JOIN users u ON o.doctor_id COLLATE utf8mb4_general_ci = u.user_id COLLATE utf8mb4_general_ci
    LEFT JOIN ip_admissions ip ON o.patient_id COLLATE utf8mb4_general_ci = ip.patient_id COLLATE utf8mb4_general_ci AND ip.status COLLATE utf8mb4_general_ci = 'Admitted'
    LEFT JOIN invoices inv ON o.patient_id COLLATE utf8mb4_general_ci = inv.patient_id COLLATE utf8mb4_general_ci
    ORDER BY o.created_at DESC
  `);

  const orders = ordersRes.rows;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.order_id);
  const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(',');

  const itemsRes = await query(`
    SELECT toi.*,
           ds.name as service_name, ds.service_code, ds.sample_required, ds.normal_range, ds.price, ds.report_type,
           c.name as category_name,
           dp.name as package_name
    FROM test_order_items toi
    LEFT JOIN diagnostic_services ds ON toi.service_id = ds.service_id COLLATE utf8mb4_general_ci
    LEFT JOIN diagnostic_categories c ON ds.category_id = c.category_id COLLATE utf8mb4_general_ci
    LEFT JOIN diagnostic_packages dp ON toi.package_id = dp.package_id COLLATE utf8mb4_general_ci
    WHERE toi.order_id IN (${placeholders})
  `, orderIds);

  const items = itemsRes.rows || [];
  const itemIds = items.map(i => i.item_id).filter(Boolean);

  let samples: any[] = [];
  let labResults: any[] = [];
  let radReports: any[] = [];
  let usReports: any[] = [];
  let ecgReports: any[] = [];
  let verifications: any[] = [];
  let resultParams: any[] = [];

  if (itemIds.length > 0) {
    const itemPlaceholders = itemIds.map((_, i) => `$${i + 1}`).join(',');
    
    const [scRes, lrRes, rrRes, urRes, erRes, rvRes, lrpRes] = await Promise.all([
      query(`SELECT * FROM sample_collections WHERE order_item_id IN (${itemPlaceholders})`, itemIds),
      query(`SELECT * FROM lab_results WHERE order_item_id IN (${itemPlaceholders})`, itemIds),
      query(`SELECT * FROM radiology_reports WHERE order_item_id IN (${itemPlaceholders})`, itemIds),
      query(`SELECT * FROM ultrasound_reports WHERE order_item_id IN (${itemPlaceholders})`, itemIds),
      query(`SELECT * FROM ecg_reports WHERE order_item_id IN (${itemPlaceholders})`, itemIds),
      query(`SELECT * FROM report_verifications WHERE order_item_id IN (${itemPlaceholders})`, itemIds),
      query(`SELECT * FROM lab_result_parameters WHERE order_item_id IN (${itemPlaceholders}) ORDER BY created_at ASC`, itemIds)
    ]);

    samples = scRes.rows || [];
    labResults = lrRes.rows || [];
    radReports = rrRes.rows || [];
    usReports = urRes.rows || [];
    ecgReports = erRes.rows || [];
    verifications = rvRes.rows || [];
    resultParams = lrpRes.rows || [];
  }

  const serviceIds = Array.from(new Set(items.map(i => i.service_id).filter(Boolean)));
  let parameters: any[] = [];
  if (serviceIds.length > 0) {
    const servicePlaceholders = serviceIds.map((_, i) => `$${i + 1}`).join(',');
    const dpRes = await query(`
      SELECT * FROM diagnostic_parameters 
      WHERE service_id COLLATE utf8mb4_general_ci IN (${servicePlaceholders}) 
      ORDER BY display_order ASC
    `, serviceIds);
    parameters = dpRes.rows || [];
  }

  const samplesByItem: Record<string, any> = {};
  samples.forEach(s => { samplesByItem[s.order_item_id] = s; });

  const labResultByItem: Record<string, any> = {};
  labResults.forEach(lr => { labResultByItem[lr.order_item_id] = lr; });

  const radByItem: Record<string, any> = {};
  radReports.forEach(r => { radByItem[r.order_item_id] = r; });

  const usByItem: Record<string, any> = {};
  usReports.forEach(u => { usByItem[u.order_item_id] = u; });

  const ecgByItem: Record<string, any> = {};
  ecgReports.forEach(e => { ecgByItem[e.order_item_id] = e; });

  const verifByItem: Record<string, any> = {};
  verifications.forEach(v => { verifByItem[v.order_item_id] = v; });

  const resultParamsByItem: Record<string, any[]> = {};
  resultParams.forEach(rp => {
    if (!resultParamsByItem[rp.order_item_id]) resultParamsByItem[rp.order_item_id] = [];
    resultParamsByItem[rp.order_item_id].push({
      result_parameter_id: rp.result_parameter_id,
      parameter_id: rp.parameter_id,
      name: rp.parameter_name,
      unit: rp.unit,
      reference_range: rp.reference_range,
      actual_value: rp.actual_value,
      status: rp.status
    });
  });

  const paramsByService: Record<string, any[]> = {};
  parameters.forEach(p => {
    if (!paramsByService[p.service_id]) paramsByService[p.service_id] = [];
    paramsByService[p.service_id].push(p);
  });

  const itemsByOrder: Record<string, any[]> = {};
  items.forEach(item => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push({
      item_id: item.item_id,
      service_id: item.service_id,
      package_id: item.package_id,
      package_name: item.package_name || null,
      service_name: item.service_name || 'Diagnostic Test',
      service_code: item.service_code || 'TEST',
      category_name: item.category_name || 'General',
      sample_required: item.sample_required || 'None',
      normal_range: item.normal_range || '',
      price: item.price || 0,
      report_type: item.report_type || 'Structured',
      status: item.status,
      correction_required: Boolean(item.correction_required),
      sample: samplesByItem[item.item_id] || null,
      lab_result: labResultByItem[item.item_id] || null,
      radiology_report: radByItem[item.item_id] || null,
      ultrasound_report: usByItem[item.item_id] || null,
      ecg_report: ecgByItem[item.item_id] || null,
      verification: verifByItem[item.item_id] || null,
      parameters: paramsByService[item.service_id] || [],
      result_parameters: resultParamsByItem[item.item_id] || []
    });
  });

  const frontendUrl = process.env.FRONTEND_URL || 'https://hms-simon518.vercel.app';
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ctrlsyhzszlufdnguerz.supabase.co';

  return orders.map(o => {
    const formattedItems = (itemsByOrder[o.order_id] || []).map(item => {
      const cleanId = (item.item_id || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
      const s3QrUrl = `${supabaseUrl}/storage/v1/object/public/logos/qr_${cleanId}.png`;
      const verifyUrl = `${frontendUrl}/verify/reports/${item.item_id}`;

      generateAndUploadQrCode(verifyUrl, item.item_id).catch(() => {});

      return {
        ...item,
        qr_code_url: s3QrUrl
      };
    });

    return {
      ...o,
      doc_first: o.doc_first || 'Hospital',
      doc_last: o.doc_last || 'Doctor',
      items: formattedItems
    };
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
    const sampleId = uuidv4();
    await query(`
      INSERT INTO sample_collections (sample_id, order_item_id, collected_by, container_type, barcode, status, remarks)
      VALUES ($1, $2, $3, $4, $5, 'Collected', $6)
    `, [sampleId, input.itemId, userId, input.containerType, input.barcode, input.remarks || '']);

    await query(`UPDATE test_order_items SET status = 'SampleCollected' WHERE item_id = $1`, [input.itemId]);

    await query('COMMIT');
    const scFetch = await query('SELECT * FROM sample_collections WHERE sample_id = $1', [sampleId]);
    return scFetch.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 7. Results Submissions
export const submitLabResult = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const resultId = uuidv4();
    await query(`
      INSERT INTO lab_results (result_id, order_item_id, entered_by, actual_result, reference_range, status, machine_reading, remarks, machine_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [resultId, input.itemId, userId, input.actualResult || 'Multiple Values', input.referenceRange || '', input.status || 'Normal', input.machineReading || '', input.remarks || '', input.machineId || null]);

    if (input.parameters && Array.isArray(input.parameters)) {
      await query(`DELETE FROM lab_result_parameters WHERE order_item_id = $1`, [input.itemId]);
      for (const p of input.parameters) {
        const rpId = uuidv4();
        await query(
          `INSERT INTO lab_result_parameters (result_parameter_id, order_item_id, parameter_id, parameter_name, unit, reference_range, actual_value, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            rpId,
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
    const lrFetch = await query('SELECT * FROM lab_results WHERE result_id = $1', [resultId]);
    return lrFetch.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const submitRadiologyReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const reportId = uuidv4();
    await query(`
      INSERT INTO radiology_reports (report_id, order_item_id, radiographer_id, radiologist_id, image_urls, findings, impression, conclusion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [reportId, input.itemId, userId, input.radiologistId || userId, JSON.stringify(input.imageUrls || []), input.findings, input.impression, input.conclusion || '']);

    await query(`UPDATE test_order_items SET status = 'Resulted', correction_required = FALSE WHERE item_id = $1`, [input.itemId]);
    await query('COMMIT');
    const rrFetch = await query('SELECT * FROM radiology_reports WHERE report_id = $1', [reportId]);
    return rrFetch.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const submitUltrasoundReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const reportId = uuidv4();
    await query(`
      INSERT INTO ultrasound_reports (report_id, order_item_id, sonologist_id, clinical_history, findings, impression, recommendations)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [reportId, input.itemId, input.sonologistId || userId, input.clinicalHistory || '', input.findings, input.impression, input.recommendations || '']);

    await query(`UPDATE test_order_items SET status = 'Resulted', correction_required = FALSE WHERE item_id = $1`, [input.itemId]);
    await query('COMMIT');
    const urFetch = await query('SELECT * FROM ultrasound_reports WHERE report_id = $1', [reportId]);
    return urFetch.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const submitEcgReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const reportId = uuidv4();
    await query(`
      INSERT INTO ecg_reports (report_id, order_item_id, operator_id, doctor_id, graph_url, findings, interpretation, recommendation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [reportId, input.itemId, userId, input.doctorId || userId, input.graphUrl || '', input.findings, input.interpretation, input.recommendation || '']);

    if (input.parameters && Array.isArray(input.parameters)) {
      await query(`DELETE FROM lab_result_parameters WHERE order_item_id = $1`, [input.itemId]);
      for (const p of input.parameters) {
        const rpId = uuidv4();
        await query(
          `INSERT INTO lab_result_parameters (result_parameter_id, order_item_id, parameter_id, parameter_name, unit, reference_range, actual_value, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            rpId,
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
    const erFetch = await query('SELECT * FROM ecg_reports WHERE report_id = $1', [reportId]);
    return erFetch.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 8. Verification (Approve / Reject)
export const verifyReport = async (input: any, userId: string) => {
  await query('BEGIN');
  try {
    const verificationId = uuidv4();
    await query(`
      INSERT INTO report_verifications (verification_id, order_item_id, verified_by, digital_signature_used, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [verificationId, input.itemId, userId, input.digitalSignatureUsed || 'Verified digitally', input.status, input.notes || '']);

    let finalStatus = 'Ordered';
    let correctionRequired = false;

    if (input.status === 'Approved') {
      finalStatus = 'Verified';
    } else if (input.status === 'Correction') {
      correctionRequired = true;
      const itemRes = await query(`
        SELECT ds.sample_required 
        FROM test_order_items toi
        JOIN diagnostic_services ds ON toi.service_id = ds.service_id COLLATE utf8mb4_general_ci
        WHERE toi.item_id = $1
      `, [input.itemId]);
      const sampleReq = itemRes.rows[0]?.sample_required;
      const requiresSample = sampleReq && sampleReq !== 'None' && sampleReq !== '';
      finalStatus = requiresSample ? 'SampleCollected' : 'Ordered';
    }

    await query(`UPDATE test_order_items SET status = $1, correction_required = $2 WHERE item_id = $3`, [finalStatus, correctionRequired, input.itemId]);
    await query('COMMIT');
    const rvFetch = await query('SELECT * FROM report_verifications WHERE verification_id = $1', [verificationId]);
    return rvFetch.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 9. Machines
export const getMachines = async () => {
  const result = await query('SELECT * FROM machines ORDER BY name');
  return result.rows || [];
};

export const addMachine = async (input: any) => {
  const machineId = uuidv4();
  await query(`
    INSERT INTO machines (machine_id, name, model, serial_number, department, status, last_maintenance_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    machineId, input.name, input.model || '', input.serialNumber || '',
    input.department || 'Laboratory', input.status || 'Operational', input.maintenanceDate || null
  ]);
  const res = await query('SELECT * FROM machines WHERE machine_id = $1', [machineId]);
  return res.rows[0];
};

// 10. Referral Doctors
export const getReferrals = async () => {
  const result = await query('SELECT * FROM referral_doctors ORDER BY name');
  return result.rows || [];
};

export const addReferral = async (input: any) => {
  const referralId = uuidv4();
  await query(`
    INSERT INTO referral_doctors (referral_id, name, hospital_clinic_name, commission_percentage, phone, email)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [referralId, input.name, input.hospital || input.hospitalClinicName || '', input.commissionPercentage || 0, input.phone || '', input.email || '']);
  const res = await query('SELECT * FROM referral_doctors WHERE referral_id = $1', [referralId]);
  return res.rows[0];
};

// 11. Quality Control Logs
export const getQcLogs = async () => {
  const result = await query(`
    SELECT qc.*, m.name as machine_name, u.first_name, u.last_name
    FROM qc_logs qc
    LEFT JOIN machines m ON qc.machine_id = m.machine_id COLLATE utf8mb4_general_ci
    LEFT JOIN users u ON qc.performed_by = u.user_id COLLATE utf8mb4_general_ci
    ORDER BY qc.created_at DESC
  `);
  return result.rows || [];
};

export const addQcLog = async (input: any, userId: string) => {
  const qcId = uuidv4();
  await query(`
    INSERT INTO qc_logs (qc_id, machine_id, parameter_name, target_value, measured_value, status, performed_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [qcId, input.machineId, input.qcParameter || input.parameterName, input.expectedValue || input.targetValue || 0, input.actualValue || input.measuredValue || 0, input.status || 'Passed', userId]);
  const res = await query('SELECT * FROM qc_logs WHERE qc_id = $1', [qcId]);
  return res.rows[0];
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
  const orders = await getOrders();
  for (const order of orders) {
    if (order.items && Array.isArray(order.items)) {
      const match = order.items.find((i: any) => i.item_id === itemId || order.order_id === itemId || order.order_number === itemId);
      if (match) {
        return {
          ...match,
          patient_name: `${order.first_name} ${order.last_name}`,
          patient_mrn: order.medical_record_number,
          gender: order.gender,
          patient_gender: order.patient_gender,
          birth_date: order.birth_date,
          patient_birth_date: order.patient_birth_date,
          patient_phone: order.patient_phone,
          doc_first: order.doc_first,
          doc_last: order.doc_last,
          order_number: order.order_number,
          order_created_at: order.created_at
        };
      }
    }
  }
  return null;
};
