import { query, getClient } from '../../config/database';
import { CreateInvoiceInput, RecordPaymentInput } from './billing.schema';
import { AppError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const createInvoice = async (input: CreateInvoiceInput) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalAmount = subtotal - (input.discount || 0) + (input.tax || 0);
    const patientResponsibility = totalAmount - (input.insuranceCoverage || 0);

    let amountPaid = 0.00;
    if (input.paidAmount !== undefined && input.paidAmount !== null) {
      amountPaid = Number(input.paidAmount);
    } else if (input.amountPaid !== undefined && input.amountPaid !== null) {
      amountPaid = Number(input.amountPaid);
    } else if (input.paymentStatus === 'Paid') {
      amountPaid = patientResponsibility;
    }

    if (amountPaid > patientResponsibility) {
      amountPaid = patientResponsibility;
    }
    if (amountPaid < 0) {
      amountPaid = 0.00;
    }

    const dueAmount = Math.max(0, patientResponsibility - amountPaid);

    let status = 'Unpaid';
    if (amountPaid >= patientResponsibility && patientResponsibility > 0) {
      status = 'Paid';
    } else if (amountPaid > 0) {
      status = 'PartiallyPaid';
    } else if (input.paymentStatus) {
      status = input.paymentStatus;
    }

    const paymentMethod = amountPaid > 0 ? (input.paymentMethod || 'Cash') : (input.paymentMethod || null);

    const invoiceId = uuidv4();
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

    await client.query(
      `INSERT INTO invoices (invoice_id, invoice_number, patient_id, encounter_id, total_amount, discount, tax, insurance_coverage, patient_responsibility, amount_paid, due_amount, status, payment_method, notes, doctor_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        invoiceId,
        invoiceNum,
        input.patientId, 
        input.encounterId || null, 
        totalAmount, 
        input.discount || 0, 
        input.tax || 0, 
        input.insuranceCoverage || 0, 
        patientResponsibility,
        amountPaid,
        dueAmount,
        status,
        paymentMethod,
        input.notes || null,
        input.doctorName || input.doctor_name || null
      ]
    );

    // Record initial payment log entry if advance/full payment was made
    if (amountPaid > 0) {
      const paymentId = uuidv4();
      const paymentType = amountPaid >= patientResponsibility ? 'Full Payment' : 'Advance Payment';
      try {
        await client.query(
          `INSERT INTO invoice_payment_logs (payment_id, invoice_id, amount_paid, payment_type, payment_mode, transaction_ref, remaining_due_after_txn, collected_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            paymentId,
            invoiceId,
            amountPaid,
            paymentType,
            paymentMethod || 'Cash',
            input.notes || null,
            dueAmount,
            'Reception Staff'
          ]
        );
      } catch (e) {
        console.error('Failed to log initial payment transaction:', e);
      }
    }

    // Also mirror into billing_invoices if table exists
    try {
      await client.query(
        `INSERT INTO billing_invoices (invoice_id, invoice_number, patient_id, total_amount, paid_amount, balance_amount, status, payment_mode, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [invoiceId, invoiceNum, input.patientId, totalAmount, amountPaid, patientResponsibility - amountPaid, status, paymentMethod || 'Cash', input.notes || null]
      );
    } catch (e) {
      // Ignore if billing_invoices table structure differs
    }

    for (const item of input.items) {
      const itemId = uuidv4();
      await client.query(
        `INSERT INTO invoice_items (item_id, invoice_id, description, category, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [itemId, invoiceId, item.description, item.category || 'General', item.quantity, item.unitPrice, item.quantity * item.unitPrice]
      );
    }

    // Hook: Automatically create a diagnostics test order if any diagnostics/lab items are billed
    const diagnosticItems = input.items.filter((item: any) => {
      const cat = (item.category || '').toLowerCase();
      const isDiagCat = 
        cat.includes('diagnostics') || 
        cat.includes('lab') || 
        cat.includes('radiology') || 
        cat.includes('ultrasound') || 
        cat.includes('ecg') || 
        cat.includes('cardiology');
        
      const desc = (item.description || '').toLowerCase();
      const isDiagDesc = desc.length > 0;

      return isDiagCat || isDiagDesc;
    });

    if (diagnosticItems.length > 0) {
      let doctorId = null;
      if (input.doctorName || input.doctor_name) {
        const docNameStr = (input.doctorName || input.doctor_name || '').toString();
        const cleanDoc = docNameStr.replace(/^Dr\.\s*/i, '').split('(')[0].trim();
        try {
          const docMatch = await client.query(
            "SELECT user_id FROM users WHERE CONCAT(first_name, ' ', COALESCE(last_name, '')) LIKE $1 LIMIT 1",
            [`%${cleanDoc}%`]
          );
          if (docMatch.rows.length > 0) doctorId = docMatch.rows[0].user_id;
        } catch (e) {}
      }
      if (!doctorId && input.encounterId) {
        try {
          const encRes = await client.query('SELECT provider_id FROM encounters WHERE encounter_id = $1', [input.encounterId]);
          if (encRes.rows.length > 0) doctorId = encRes.rows[0].provider_id;
        } catch (e) {}
      }
      if (!doctorId) {
        try {
          const patRes = await client.query('SELECT doctor_id FROM patients WHERE patient_id = $1', [input.patientId]);
          if (patRes.rows.length > 0) doctorId = patRes.rows[0].doctor_id;
        } catch (e) {}
      }
      if (!doctorId) {
        const docRes = await client.query("SELECT user_id FROM users WHERE role = 'Doctor' OR role = 'Admin' ORDER BY role LIMIT 1");
        if (docRes.rows.length > 0) doctorId = docRes.rows[0].user_id;
      }

      if (doctorId) {
        const orderId = uuidv4();
        const orderNum = `BILL-LAB-${invoiceId.substring(0, 8).toUpperCase()}`;
        const paymentStatus = status === 'Paid' ? 'Paid' : 'Unpaid';
        
        await client.query(
          `INSERT INTO test_orders (order_id, order_number, patient_id, doctor_id, priority, clinical_notes, diagnosis, payment_status, status)
           VALUES ($1, $2, $3, $4, 'Routine', 'Ordered from Invoices & Billing Panel', 'Billed', $5, 'Ordered')`,
          [orderId, orderNum, input.patientId, doctorId, paymentStatus]
        );

        for (const diagItem of diagnosticItems) {
          const descClean = diagItem.description.trim();
          const searchParam = `%${descClean.toLowerCase()}%`;

          // Check if item is a grouped Profile / Package
          const pkgRes = await client.query(
            `SELECT package_id FROM diagnostic_packages 
             WHERE LOWER(name) = LOWER($1) OR LOWER(name) LIKE $2
             LIMIT 1`,
            [descClean, searchParam]
          );

          if (pkgRes.rows.length > 0) {
            const packageId = pkgRes.rows[0].package_id;
            const pServices = await client.query(
              `SELECT service_id FROM diagnostic_package_items WHERE package_id = $1`,
              [packageId]
            );
            for (const ps of pServices.rows) {
              const orderItemId = uuidv4();
              await client.query(
                `INSERT INTO test_order_items (item_id, order_id, service_id, package_id, status)
                 VALUES ($1, $2, $3, $4, 'Ordered')`,
                [orderItemId, orderId, ps.service_id, packageId]
              );
            }
            continue;
          }

          // General Fallback mapping for services
          let serviceId = null;
          let servRes = await client.query(
            `SELECT service_id FROM diagnostic_services 
             WHERE LOWER(name) = LOWER($1) OR LOWER(service_code) = LOWER($2) 
             LIMIT 1`,
            [descClean, descClean]
          );
          
          if (servRes.rows.length === 0) {
            servRes = await client.query(
              `SELECT service_id FROM diagnostic_services 
               WHERE LOWER(name) LIKE $1 OR LOWER(service_code) LIKE $2
               LIMIT 1`,
              [searchParam, searchParam]
            );
          }

          if (servRes.rows.length > 0) {
            serviceId = servRes.rows[0].service_id;
          } else {
            const firstServ = await client.query(`SELECT service_id FROM diagnostic_services LIMIT 1`);
            if (firstServ.rows.length > 0) serviceId = firstServ.rows[0].service_id;
          }

          if (serviceId) {
            const orderItemId = uuidv4();
            await client.query(
              `INSERT INTO test_order_items (item_id, order_id, service_id, status)
               VALUES ($1, $2, $3, 'Ordered')`,
              [orderItemId, orderId, serviceId]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    const createdInvoice = await client.query('SELECT * FROM invoices WHERE invoice_id = $1', [invoiceId]);
    return createdInvoice.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getInvoiceById = async (id: string) => {
  const result = await query(
    `SELECT i.*, 
            CONCAT(p.first_name, ' ', p.last_name) as patient_name, 
            p.first_name, p.last_name, p.phone, p.address, p.mrn as medical_record_number, FALSE as is_inpatient,
            p.gender, p.date_of_birth AS birth_date, 0 AS patient_age,
            COALESCE(
              NULLIF(i.doctor_name, ''),
              (SELECT CASE 
                        WHEN u.first_name LIKE 'Dr%' THEN CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))
                        ELSE CONCAT('Dr. ', u.first_name, ' ', COALESCE(u.last_name, ''))
                      END
               FROM test_orders o 
               JOIN users u ON o.doctor_id COLLATE utf8mb4_general_ci = u.user_id COLLATE utf8mb4_general_ci 
               WHERE (o.order_number COLLATE utf8mb4_general_ci = i.invoice_number COLLATE utf8mb4_general_ci 
                   OR o.order_number COLLATE utf8mb4_general_ci LIKE CONCAT('%', SUBSTRING_INDEX(i.invoice_id, '-', 1), '%')
                   OR o.patient_id COLLATE utf8mb4_general_ci = i.patient_id COLLATE utf8mb4_general_ci)
               ORDER BY o.created_at DESC LIMIT 1),
              (SELECT CASE 
                        WHEN u.first_name LIKE 'Dr%' THEN CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))
                        ELSE CONCAT('Dr. ', u.first_name, ' ', COALESCE(u.last_name, ''))
                      END
               FROM appointments app 
               JOIN users u ON app.doctor_id COLLATE utf8mb4_general_ci = u.user_id COLLATE utf8mb4_general_ci 
               WHERE app.patient_id COLLATE utf8mb4_general_ci = i.patient_id COLLATE utf8mb4_general_ci 
               ORDER BY app.created_at DESC LIMIT 1),
              'Dr. System Admin'
            ) as doctor_name
     FROM invoices i 
     JOIN patients p ON i.patient_id = p.patient_id COLLATE utf8mb4_unicode_ci
     WHERE i.invoice_id = $1`, [id]
  );
  if (result.rows.length === 0) throw new AppError('Invoice not found.', 404);
  const items = await query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
  const invoice = result.rows[0];
  invoice.items = items.rows;

  try {
    const logs = await query(
      `SELECT * FROM invoice_payment_logs WHERE invoice_id = $1 ORDER BY payment_timestamp ASC`,
      [id]
    );
    invoice.payment_logs = logs.rows;
  } catch (e) {
    invoice.payment_logs = [];
  }

  return invoice;
};

export const getAllInvoices = async (filters: { status?: string; limit?: number; offset?: number }) => {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  if (filters.status) { params.push(filters.status); whereClause += ` AND i.status = $${params.length}`; }

  const countResult = await query(`SELECT COUNT(*) as total FROM invoices i ${whereClause}`, params);
  const dataParams = [...params];
  let limitClause = '';
  if (filters.limit) { dataParams.push(filters.limit); limitClause += ` LIMIT $${dataParams.length}`; }
  if (filters.offset) { dataParams.push(filters.offset); limitClause += ` OFFSET $${dataParams.length}`; }

  const result = await query(
    `SELECT i.*, 
            CONCAT(p.first_name, ' ', p.last_name) as patient_name,
            p.phone as patient_phone,
            p.mrn as patient_mrn,
            FALSE as is_inpatient,
            COALESCE(
              NULLIF(i.doctor_name, ''),
              (SELECT CASE 
                        WHEN u.first_name LIKE 'Dr%' THEN CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))
                        ELSE CONCAT('Dr. ', u.first_name, ' ', COALESCE(u.last_name, ''))
                      END
               FROM test_orders o 
               JOIN users u ON o.doctor_id COLLATE utf8mb4_general_ci = u.user_id COLLATE utf8mb4_general_ci 
               WHERE (o.order_number COLLATE utf8mb4_general_ci = i.invoice_number COLLATE utf8mb4_general_ci 
                   OR o.order_number COLLATE utf8mb4_general_ci LIKE CONCAT('%', SUBSTRING_INDEX(i.invoice_id, '-', 1), '%')
                   OR o.patient_id COLLATE utf8mb4_general_ci = i.patient_id COLLATE utf8mb4_general_ci)
               ORDER BY o.created_at DESC LIMIT 1),
              (SELECT CASE 
                        WHEN u.first_name LIKE 'Dr%' THEN CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))
                        ELSE CONCAT('Dr. ', u.first_name, ' ', COALESCE(u.last_name, ''))
                      END
               FROM appointments app 
               JOIN users u ON app.doctor_id COLLATE utf8mb4_general_ci = u.user_id COLLATE utf8mb4_general_ci 
               WHERE app.patient_id COLLATE utf8mb4_general_ci = i.patient_id COLLATE utf8mb4_general_ci 
               ORDER BY app.created_at DESC LIMIT 1),
              'Dr. System Admin'
            ) as doctor_name
     FROM invoices i
     JOIN patients p ON i.patient_id = p.patient_id COLLATE utf8mb4_unicode_ci
     ${whereClause} 
     ORDER BY i.created_at DESC ${limitClause}`, dataParams
  );
  return { invoices: result.rows, total: parseInt(countResult.rows[0]?.total || '0', 10) };
};

export const getPatientInvoices = async (patientId: string) => {
  const result = await query('SELECT * FROM invoices WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]);
  return result.rows;
};

export const recordPayment = async (id: string, input: RecordPaymentInput) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);

  const invoice = existing.rows[0];
  const patientResponsibility = parseFloat(invoice.patient_responsibility || invoice.total_amount);
  const currentPaid = parseFloat(invoice.amount_paid || 0);

  if (input.amountPaid <= 0) {
    throw new AppError('Payment amount must be greater than zero.', 400);
  }

  const currentDue = Math.max(0, patientResponsibility - currentPaid);
  if (input.amountPaid > currentDue + 0.01) {
    throw new AppError(`Payment amount (Rs. ${input.amountPaid}) cannot exceed current balance due (Rs. ${currentDue.toFixed(2)}).`, 400);
  }

  const newAmountPaid = Math.min(patientResponsibility, currentPaid + input.amountPaid);
  const newDueAmount = Math.max(0, patientResponsibility - newAmountPaid);

  let newStatus = 'PartiallyPaid';
  if (newDueAmount === 0 || newAmountPaid >= patientResponsibility) newStatus = 'Paid';

  await query(
    `UPDATE invoices SET amount_paid = $1, due_amount = $2, status = $3, payment_method = $4 WHERE invoice_id = $5`,
    [newAmountPaid, newDueAmount, newStatus, input.paymentMethod, id]
  );

  // Sync diagnostic test order payment status & billing_invoices if matching
  const orderNum = `BILL-LAB-${id.substring(0, 8).toUpperCase()}`;
  try {
    await query(`UPDATE test_orders SET payment_status = $1 WHERE order_number = $2`, [newStatus, orderNum]);
    await query(
      `UPDATE billing_invoices SET paid_amount = $1, balance_amount = $2, status = $3, payment_mode = $4 WHERE invoice_id COLLATE utf8mb4_general_ci = $5 COLLATE utf8mb4_general_ci`,
      [newAmountPaid, newDueAmount, newStatus, input.paymentMethod, id]
    );
  } catch (e) {
    // Ignore
  }

  // Insert payment history audit log
  const paymentId = uuidv4();
  const paymentType = newDueAmount === 0 ? 'Final Settlement' : 'Due Collection';
  const collectedBy = input.collectedBy || 'Reception Staff';
  const timestamp = input.paymentTimestamp ? new Date(input.paymentTimestamp) : new Date();

  try {
    await query(
      `INSERT INTO invoice_payment_logs (payment_id, invoice_id, amount_paid, payment_type, payment_mode, transaction_ref, remaining_due_after_txn, collected_by, payment_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        paymentId,
        id,
        input.amountPaid,
        paymentType,
        input.paymentMethod,
        input.transactionRef || null,
        newDueAmount,
        collectedBy,
        timestamp
      ]
    );
  } catch (e) {
    console.error('Failed to log payment transaction:', e);
  }

  return await getInvoiceById(id);
};

export const cancelInvoice = async (id: string) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);
  
  const invoice = existing.rows[0];
  if (invoice.status === 'Paid') {
    throw new AppError('Cannot cancel a fully paid invoice. Try returning/refunding it instead.', 400);
  }

  await query(`UPDATE invoices SET status = 'Cancelled' WHERE invoice_id = $1`, [id]);
  const updated = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  return updated.rows[0];
};

export const returnInvoice = async (id: string) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);

  const invoice = existing.rows[0];
  const patientResponsibility = parseFloat(invoice.patient_responsibility || invoice.total_amount);

  await query(`UPDATE invoices SET status = 'Returned', amount_paid = 0.00, due_amount = $1 WHERE invoice_id = $2`, [patientResponsibility, id]);
  const updated = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  return updated.rows[0];
};

export const updateInvoiceStatus = async (id: string, status: 'Paid' | 'Unpaid' | 'PartiallyPaid', paymentMethod: string) => {
  const existing = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Invoice not found.', 404);

  const invoice = existing.rows[0];
  const patientResponsibility = parseFloat(invoice.patient_responsibility || invoice.total_amount);
  const targetAmountPaid = status === 'Paid' ? patientResponsibility : (status === 'Unpaid' ? 0.00 : parseFloat(invoice.amount_paid || 0));
  const targetDueAmount = Math.max(0, patientResponsibility - targetAmountPaid);

  await query(
    `UPDATE invoices SET amount_paid = $1, due_amount = $2, status = $3, payment_method = $4 WHERE invoice_id = $5`,
    [targetAmountPaid, targetDueAmount, status, paymentMethod, id]
  );

  // Sync diagnostic test order payment status & billing_invoices if matching
  const orderNum = `BILL-LAB-${id.substring(0, 8).toUpperCase()}`;
  try {
    await query(`UPDATE test_orders SET payment_status = $1 WHERE order_number = $2`, [status, orderNum]);
    await query(
      `UPDATE billing_invoices SET paid_amount = $1, balance_amount = $2, status = $3, payment_mode = $4 WHERE invoice_id COLLATE utf8mb4_general_ci = $5 COLLATE utf8mb4_general_ci`,
      [targetAmountPaid, targetDueAmount, status, paymentMethod, id]
    );
  } catch (e) {
    // Ignore
  }

  const updated = await query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
  return updated.rows[0];
};

export const getBillingAnalytics = async (options: {
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  let dateFilter = '';
  const params: any[] = [];
  const period = options.period || 'month';

  if (period === 'today') {
    dateFilter = "AND i.created_at >= CURRENT_DATE AND i.created_at < CURRENT_DATE + INTERVAL 1 DAY";
  } else if (period === 'week') {
    dateFilter = "AND i.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)";
  } else if (period === 'month') {
    dateFilter = "AND i.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)";
  } else if (period === 'year') {
    dateFilter = "AND i.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)";
  } else if (period === 'custom' && options.startDate && options.endDate) {
    params.push(options.startDate);
    params.push(options.endDate + ' 23:59:59');
    dateFilter = `AND i.created_at >= $1 AND i.created_at <= $2`;
  }

  // Summary Metrics Query
  const summaryRes = await query(`
    SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(i.total_amount), 0) as total_revenue,
      COALESCE(SUM(i.amount_paid), 0) as total_amount_paid,
      COALESCE(SUM(i.total_amount - i.amount_paid), 0) as total_pending_amount,
      
      COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) as paid_invoices_count,
      COUNT(CASE WHEN i.status = 'Unpaid' THEN 1 END) as unpaid_invoices_count,
      COUNT(CASE WHEN i.status = 'PartiallyPaid' THEN 1 END) as partial_invoices_count,
      COUNT(CASE WHEN i.status = 'Cancelled' THEN 1 END) as cancelled_invoices_count,
      
      -- Payment Method Breakdown
      COUNT(CASE WHEN LOWER(i.payment_method) = 'cash' THEN 1 END) as cash_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'cash' THEN i.amount_paid ELSE 0 END), 0) as cash_amount,
      
      COUNT(CASE WHEN LOWER(i.payment_method) = 'upi' THEN 1 END) as upi_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'upi' THEN i.amount_paid ELSE 0 END), 0) as upi_amount,
      
      COUNT(CASE WHEN LOWER(i.payment_method) = 'card' THEN 1 END) as card_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'card' THEN i.amount_paid ELSE 0 END), 0) as card_amount,

      COUNT(CASE WHEN LOWER(i.payment_method) = 'bank transfer' THEN 1 END) as bank_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'bank transfer' THEN i.amount_paid ELSE 0 END), 0) as bank_amount,
      
      COUNT(CASE WHEN LOWER(i.payment_method) = 'insurance' OR i.insurance_coverage > 0 THEN 1 END) as insurance_count,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'insurance' THEN i.amount_paid ELSE i.insurance_coverage END), 0) as insurance_amount,
      
      -- IP vs OP Breakdown
      COUNT(CASE WHEN i.ip_admission_id IS NOT NULL THEN 1 END) as ip_invoices_count,
      COALESCE(SUM(CASE WHEN i.ip_admission_id IS NOT NULL THEN i.total_amount ELSE 0 END), 0) as ip_amount,
      
      COUNT(CASE WHEN i.ip_admission_id IS NULL THEN 1 END) as op_invoices_count,
      COALESCE(SUM(CASE WHEN i.ip_admission_id IS NULL THEN i.total_amount ELSE 0 END), 0) as op_amount

    FROM invoices i
    JOIN patients p ON i.patient_id = p.patient_id
    WHERE 1=1 ${dateFilter}
  `, params);

  // Daily Trend Breakdown
  const trendRes = await query(`
    SELECT 
      DATE_FORMAT(i.created_at, '%Y-%m-%d') as date_label,
      COUNT(*) as invoice_count,
      COALESCE(SUM(i.total_amount), 0) as total_amount,
      COALESCE(SUM(i.amount_paid), 0) as amount_paid,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'cash' THEN i.amount_paid ELSE 0 END), 0) as cash_amount,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'upi' THEN i.amount_paid ELSE 0 END), 0) as upi_amount,
      COALESCE(SUM(CASE WHEN LOWER(i.payment_method) = 'card' THEN i.amount_paid ELSE 0 END), 0) as card_amount,
      COALESCE(SUM(CASE WHEN i.ip_admission_id IS NOT NULL THEN i.total_amount ELSE 0 END), 0) as ip_amount
    FROM invoices i
    JOIN patients p ON i.patient_id = p.patient_id
    WHERE 1=1 ${dateFilter}
    GROUP BY DATE_FORMAT(i.created_at, '%Y-%m-%d')
    ORDER BY date_label ASC
  `, params);

  const row = summaryRes.rows[0] || {};
  return {
    period,
    totalInvoices: parseInt(row.total_invoices, 10) || 0,
    totalRevenue: parseFloat(row.total_revenue) || 0,
    totalAmountPaid: parseFloat(row.total_amount_paid) || 0,
    totalPendingAmount: parseFloat(row.total_pending_amount) || 0,
    
    paidInvoicesCount: parseInt(row.paid_invoices_count, 10) || 0,
    unpaidInvoicesCount: parseInt(row.unpaid_invoices_count, 10) || 0,
    partialInvoicesCount: parseInt(row.partial_invoices_count, 10) || 0,
    cancelledInvoicesCount: parseInt(row.cancelled_invoices_count, 10) || 0,
    
    cashCount: parseInt(row.cash_count, 10) || 0,
    cashAmount: parseFloat(row.cash_amount) || 0,
    
    upiCount: parseInt(row.upi_count, 10) || 0,
    upiAmount: parseFloat(row.upi_amount) || 0,

    cardCount: parseInt(row.card_count, 10) || 0,
    cardAmount: parseFloat(row.card_amount) || 0,

    bankCount: parseInt(row.bank_count, 10) || 0,
    bankAmount: parseFloat(row.bank_amount) || 0,

    insuranceCount: parseInt(row.insurance_count, 10) || 0,
    insuranceAmount: parseFloat(row.insurance_amount) || 0,

    ipInvoicesCount: parseInt(row.ip_invoices_count, 10) || 0,
    ipAmount: parseFloat(row.ip_amount) || 0,

    opInvoicesCount: parseInt(row.op_invoices_count, 10) || 0,
    opAmount: parseFloat(row.op_amount) || 0,

    dailyTrends: trendRes.rows.map(r => ({
      date: r.date_label,
      invoiceCount: parseInt(r.invoice_count, 10) || 0,
      totalAmount: parseFloat(r.total_amount) || 0,
      amountPaid: parseFloat(r.amount_paid) || 0,
      cashAmount: parseFloat(r.cash_amount) || 0,
      upiAmount: parseFloat(r.upi_amount) || 0,
      cardAmount: parseFloat(r.card_amount) || 0,
      ipAmount: parseFloat(r.ip_amount) || 0
    }))
  };
};
