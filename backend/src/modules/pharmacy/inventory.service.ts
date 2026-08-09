import { query } from '../../config/database';
import { CreateInventoryItemInput, UpdateInventoryItemInput, CreateSaleInput } from './pharmacy.schema';
import { AppError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const getInventory = async (options: { search?: string; lowStock?: boolean; limit?: number; offset?: number }) => {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (options.search) {
    params.push(`%${options.search}%`);
    whereClause += ` AND (LOWER(item_name) LIKE LOWER($${params.length}) OR LOWER(sku) LIKE LOWER($${params.length}) OR LOWER(category) LIKE LOWER($${params.length}))`;
  }
  if (options.lowStock) {
    whereClause += ` AND stock_quantity <= reorder_level`;
  }

  const countResult = await query(`SELECT COUNT(*) as total FROM inventory_items ${whereClause}`, params);

  const dataParams = [...params];
  let limitClause = '';
  if (options.limit) { dataParams.push(options.limit); limitClause += ` LIMIT $${dataParams.length}`; }
  if (options.offset) { dataParams.push(options.offset); limitClause += ` OFFSET $${dataParams.length}`; }

  const result = await query(
    `SELECT * FROM inventory_items ${whereClause} ORDER BY item_name ASC ${limitClause}`, dataParams
  );

  return { items: result.rows, total: parseInt(countResult.rows[0].total, 10) };
};

export const getInventoryItemById = async (id: string) => {
  const result = await query('SELECT * FROM inventory_items WHERE item_id = $1', [id]);
  if (result.rows.length === 0) throw new AppError('Inventory item not found.', 404);
  return result.rows[0];
};

export const createInventoryItem = async (input: CreateInventoryItemInput) => {
  const itemId = uuidv4();
  await query(
    `INSERT INTO inventory_items (item_id, item_name, sku, category, manufacturer, stock_quantity, reorder_level, unit_price, expiry_date, generic_name, batch_no, rack_no, purchase_price, is_sheet, tablets_per_sheet, hsn_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      itemId, input.itemName, input.sku, input.category, input.manufacturer || null, input.stockQuantity, input.reorderLevel, input.unitPrice, input.expiryDate,
      input.genericName, input.batchNo, input.rackNo, input.purchasePrice, input.isSheet || false, input.tabletsPerSheet || 1, input.hsnCode || '30049099'
    ]
  );
  return getInventoryItemById(itemId);
};

export const bulkCreateInventoryItems = async (items: any[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('No valid inventory items provided for bulk upload.', 400);
  }

  const insertedItems: any[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    const itemName = String(raw.itemName || raw.item_name || raw.name || '').trim();
    if (!itemName) continue; // Skip blank rows

    const genericName = String(raw.genericName || raw.generic_name || itemName).trim();
    const sku = String(raw.sku || `SKU-${timestamp}-${i + 1}`).trim();
    const category = String(raw.category || 'General').trim();
    const manufacturer = String(raw.manufacturer || raw.brandName || raw.brand_name || '').trim() || null;
    const batchNo = String(raw.batchNo || raw.batch_no || raw.batchNumber || `BATCH-${timestamp}`).trim();
    const rackNo = String(raw.rackNo || raw.rack_no || raw.rackLocation || 'Rack A-1').trim();

    const stockQuantity = Math.max(0, Number(raw.stockQuantity ?? raw.stock_quantity ?? raw.quantity ?? 0));
    const reorderLevel = Math.max(0, Number(raw.reorderLevel ?? raw.reorder_level ?? 50));
    const unitPrice = Math.max(0, Number(raw.unitPrice ?? raw.unit_price ?? raw.sellingPrice ?? 0));
    const purchasePrice = Math.max(0, Number(raw.purchasePrice ?? raw.purchase_price ?? raw.unitCost ?? 0));

    // Expiry date handling
    let expiryDate = raw.expiryDate || raw.expiry_date || raw.expiry;
    if (!expiryDate || isNaN(Date.parse(expiryDate))) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      expiryDate = nextYear.toISOString().split('T')[0];
    } else {
      expiryDate = new Date(expiryDate).toISOString().split('T')[0];
    }

    const isSheet = String(raw.isSheet ?? raw.is_sheet ?? false).toLowerCase() === 'true' || raw.isSheet === true;
    const tabletsPerSheet = Math.max(1, Number(raw.tabletsPerSheet ?? raw.tablets_per_sheet ?? 1));
    const hsnCode = String(raw.hsnCode || raw.hsn_code || '30049099').trim();
    const itemId = uuidv4();

    await query(
      `INSERT INTO inventory_items (item_id, item_name, sku, category, manufacturer, stock_quantity, reorder_level, unit_price, expiry_date, generic_name, batch_no, rack_no, purchase_price, is_sheet, tablets_per_sheet, hsn_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        itemId, itemName, sku, category, manufacturer, stockQuantity, reorderLevel, unitPrice, expiryDate,
        genericName, batchNo, rackNo, purchasePrice, isSheet, tabletsPerSheet, hsnCode
      ]
    );

    const newItem = await getInventoryItemById(itemId);
    if (newItem) {
      insertedItems.push(newItem);
    }
  }

  return {
    importedCount: insertedItems.length,
    items: insertedItems
  };
};

export const updateInventoryItem = async (id: string, input: UpdateInventoryItemInput) => {
  const fieldMap: Record<string, string> = {
    itemName: 'item_name', category: 'category', manufacturer: 'manufacturer',
    stockQuantity: 'stock_quantity', reorderLevel: 'reorder_level', unitPrice: 'unit_price', expiryDate: 'expiry_date',
    genericName: 'generic_name', batchNo: 'batch_no', rackNo: 'rack_no', purchasePrice: 'purchase_price',
    isSheet: 'is_sheet', tabletsPerSheet: 'tablets_per_sheet', hsnCode: 'hsn_code',
  };
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [key, col] of Object.entries(fieldMap)) {
    if ((input as any)[key] !== undefined) { fields.push(`${col} = $${idx}`); values.push((input as any)[key]); idx++; }
  }
  if (fields.length === 0) throw new AppError('No fields to update.', 400);
  values.push(id);
  const result = await query(`UPDATE inventory_items SET ${fields.join(', ')} WHERE item_id = $${idx} RETURNING *`, values);
  if (result.rows.length === 0) throw new AppError('Inventory item not found.', 404);
  return result.rows[0];
};

export const getLowStockItems = async () => {
  const result = await query('SELECT * FROM inventory_items WHERE stock_quantity <= reorder_level ORDER BY stock_quantity ASC');
  return result.rows;
};

export const createSale = async (pharmacistId: string, input: CreateSaleInput) => {
  const { patientId, paymentMethod, items } = input;
  
  await query('BEGIN');
  try {
    let subtotal = 0;
    let totalDiscount = 0;
    const itemDetails: Array<{
      item_id: string;
      item_name: string;
      charge_price: number;
      quantity: number;
      unit_label: string;
      hsn_code: string;
      batch_no: string;
      expiry_date: Date;
      composition: string;
      discount: number;
    }> = [];

    for (const item of items) {
      const itemRes = await query(
        'SELECT * FROM inventory_items WHERE item_id = $1',
        [item.itemId]
      );
      if (itemRes.rows.length === 0) {
        throw new AppError(`Item with ID ${item.itemId} not found.`, 404);
      }
      
      const dbItem = itemRes.rows[0];
      const sheetPrice = parseFloat(dbItem.unit_price);
      const isSheet = dbItem.is_sheet;
      const tabletsPerSheet = parseInt(dbItem.tablets_per_sheet, 10) || 1;
      const sellLoose = item.sellLoose && isSheet;

      let chargePrice: number;
      let stockDeduction: number;
      let unitLabel: string;

      if (sellLoose) {
        chargePrice = parseFloat((sheetPrice / tabletsPerSheet).toFixed(2));
        stockDeduction = parseFloat((item.quantity / tabletsPerSheet).toFixed(4));
        unitLabel = item.quantity === 1 ? 'Tablet' : 'Tablets';
      } else {
        chargePrice = sheetPrice;
        stockDeduction = item.quantity;
        unitLabel = isSheet ? (item.quantity === 1 ? 'Sheet' : 'Sheets') : 'Unit';
      }

      if (parseFloat(dbItem.stock_quantity) < stockDeduction) {
        throw new AppError(
          `Insufficient stock for ${dbItem.item_name}. Available: ${dbItem.stock_quantity}, Requested: ${stockDeduction}`,
          400
        );
      }
      
      await query(
        'UPDATE inventory_items SET stock_quantity = stock_quantity - $1 WHERE item_id = $2',
        [stockDeduction, item.itemId]
      );
      
      const itemDiscount = item.discount || 0;
      const rowDiscountTotal = itemDiscount * item.quantity;
      totalDiscount += rowDiscountTotal;
      
      subtotal += chargePrice * item.quantity;
      itemDetails.push({
        item_id: item.itemId,
        item_name: dbItem.item_name,
        charge_price: chargePrice,
        quantity: item.quantity,
        unit_label: unitLabel,
        hsn_code: dbItem.hsn_code || '30049099',
        batch_no: dbItem.batch_no,
        expiry_date: dbItem.expiry_date,
        composition: dbItem.generic_name,
        discount: itemDiscount,
      });
    }

    const taxableAmount = subtotal - totalDiscount;
    const taxRate = 0.05; // 5% GST (2.5% CGST + 2.5% SGST)
    const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
    const total = parseFloat((taxableAmount + tax).toFixed(2));

    // First, check if patient is inpatient
    let isIp = false;
    let ipAdmissionId = null;
    
    if (patientId) {
       const pRes = await query('SELECT is_inpatient FROM patients WHERE patient_id = $1', [patientId]);
       if (pRes.rows.length > 0 && pRes.rows[0].is_inpatient) {
           isIp = true;
            const ipRes = await query(`SELECT admission_id as ip_admission_id FROM ip_admissions WHERE patient_id = $1 AND status != 'Discharged' ORDER BY created_at DESC LIMIT 1`, [patientId]);
            if (ipRes.rows.length > 0) {
                ipAdmissionId = ipRes.rows[0].ip_admission_id;
            }
       }
    }

    let finalStatus = 'Paid';
    let finalAmountPaid = total;
    let finalPaymentMethod = paymentMethod;

    if (isIp && ipAdmissionId) {
        finalStatus = 'Unpaid';
        finalAmountPaid = 0;
        finalPaymentMethod = 'IP Ledger';
    }

    const invoiceId = uuidv4();
    const invoiceNum = `PH-${Date.now().toString(36).toUpperCase()}`;

    await query(
      `INSERT INTO invoices (invoice_id, invoice_number, patient_id, total_amount, discount, tax, patient_responsibility, amount_paid, status, payment_method, notes, created_by, ip_admission_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [invoiceId, invoiceNum, patientId, total, totalDiscount, tax, total, finalAmountPaid, finalStatus, finalPaymentMethod, 'Direct pharmacy sale recorded by pharmacist', pharmacistId, ipAdmissionId]
    );

    // Mirror to billing_invoices to satisfy invoice_items FK constraint if defined
    try {
      await query(
        `INSERT INTO billing_invoices (invoice_id, invoice_number, patient_id, total_amount, paid_amount, balance_amount, status, payment_mode, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, invoiceNum, patientId, total, finalAmountPaid, total - finalAmountPaid, finalStatus, finalPaymentMethod, 'Direct pharmacy sale']
      );
    } catch (bErr) {
      console.warn('billing_invoices mirror skipped:', bErr);
    }

    for (const details of itemDetails) {
      const invoiceItemId = uuidv4();
      const lineTotal = parseFloat((details.charge_price * details.quantity).toFixed(2));
      await query(
        `INSERT INTO invoice_items (item_id, invoice_id, description, category, quantity, unit_price, total_price, hsn_code, batch_no, expiry_date, composition, discount, unit)
         VALUES ($1, $2, $3, 'Medication', $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          invoiceItemId,
          invoiceId, 
          `${details.item_name} (${details.unit_label})`, 
          details.quantity, 
          details.charge_price,
          lineTotal,
          details.hsn_code,
          details.batch_no,
          details.expiry_date,
          details.composition,
          details.discount,
          details.unit_label
        ]
      );
    }

    const invoiceRes = await query('SELECT * FROM invoices WHERE invoice_id = $1', [invoiceId]);
    const invoice = invoiceRes.rows[0] || { invoice_id: invoiceId, invoice_number: invoiceNum, total_amount: total, status: finalStatus };

    await query('COMMIT');
    return invoice;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const getSalesHistory = async () => {
  const salesQuery = `
    SELECT DISTINCT 
      i.invoice_id,
      i.total_amount,
      i.discount,
      i.tax,
      i.payment_method,
      i.created_at,
      i.notes,
      p.first_name as patient_first_name,
      p.last_name as patient_last_name,
      p.phone as patient_phone,
      p.mrn as patient_mrn,
      u.first_name as pharmacist_first_name,
      u.last_name as pharmacist_last_name,
      u.email as pharmacist_email
    FROM invoices i
    LEFT JOIN patients p ON i.patient_id COLLATE utf8mb4_unicode_ci = p.patient_id COLLATE utf8mb4_unicode_ci
    LEFT JOIN users u ON i.created_by COLLATE utf8mb4_unicode_ci = u.user_id COLLATE utf8mb4_unicode_ci
    JOIN invoice_items ii ON i.invoice_id COLLATE utf8mb4_unicode_ci = ii.invoice_id COLLATE utf8mb4_unicode_ci
    WHERE ii.category = 'Medication' OR i.notes LIKE '%pharmacy sale%'
    ORDER BY i.created_at DESC
  `;
  const salesRes = await query(salesQuery);
  const sales = salesRes.rows;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Start of week (Sunday)
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  
  // Start of month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const createEmptyStats = () => ({
    count: 0,
    amount: 0,
    byMethod: {
      UPI: { count: 0, amount: 0 },
      Card: { count: 0, amount: 0 },
      Cash: { count: 0, amount: 0 },
      Insurance: { count: 0, amount: 0 },
      'Bank Transfer': { count: 0, amount: 0 },
    }
  });

  const stats = {
    day: createEmptyStats(),
    week: createEmptyStats(),
    month: createEmptyStats()
  };

  for (const sale of sales) {
    const saleDate = new Date(sale.created_at);
    const amt = parseFloat(sale.total_amount) || 0;
    const method = sale.payment_method;

    const updateStats = (periodStats: any) => {
      periodStats.count++;
      periodStats.amount += amt;
      if (method === 'UPI') {
        periodStats.byMethod.UPI.count++;
        periodStats.byMethod.UPI.amount += amt;
      } else if (method === 'Card') {
        periodStats.byMethod.Card.count++;
        periodStats.byMethod.Card.amount += amt;
      } else if (method === 'Cash') {
        periodStats.byMethod.Cash.count++;
        periodStats.byMethod.Cash.amount += amt;
      } else if (method === 'Insurance') {
        periodStats.byMethod.Insurance.count++;
        periodStats.byMethod.Insurance.amount += amt;
      } else if (method === 'Bank Transfer') {
        periodStats.byMethod['Bank Transfer'].count++;
        periodStats.byMethod['Bank Transfer'].amount += amt;
      }
    };

    if (saleDate >= startOfDay) updateStats(stats.day);
    if (saleDate >= startOfWeek) updateStats(stats.week);
    if (saleDate >= startOfMonth) updateStats(stats.month);
  }

  return { sales, stats };
};
