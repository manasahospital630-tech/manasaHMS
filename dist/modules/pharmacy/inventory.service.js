"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesHistory = exports.createSale = exports.getLowStockItems = exports.updateInventoryItem = exports.bulkCreateInventoryItems = exports.createInventoryItem = exports.getInventoryItemById = exports.getInventory = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const getInventory = async (options) => {
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (options.search) {
        params.push(`%${options.search}%`);
        whereClause += ` AND (LOWER(item_name) LIKE LOWER($${params.length}) OR LOWER(sku) LIKE LOWER($${params.length}) OR LOWER(category) LIKE LOWER($${params.length}))`;
    }
    if (options.lowStock) {
        whereClause += ` AND stock_quantity <= reorder_level`;
    }
    const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM inventory_items ${whereClause}`, params);
    const dataParams = [...params];
    let limitClause = '';
    if (options.limit) {
        dataParams.push(options.limit);
        limitClause += ` LIMIT $${dataParams.length}`;
    }
    if (options.offset) {
        dataParams.push(options.offset);
        limitClause += ` OFFSET $${dataParams.length}`;
    }
    const result = await (0, database_1.query)(`SELECT * FROM inventory_items ${whereClause} ORDER BY item_name ASC ${limitClause}`, dataParams);
    return { items: result.rows, total: parseInt(countResult.rows[0].total, 10) };
};
exports.getInventory = getInventory;
const getInventoryItemById = async (id) => {
    const result = await (0, database_1.query)('SELECT * FROM inventory_items WHERE item_id = $1', [id]);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Inventory item not found.', 404);
    return result.rows[0];
};
exports.getInventoryItemById = getInventoryItemById;
const createInventoryItem = async (input) => {
    const result = await (0, database_1.query)(`INSERT INTO inventory_items (item_name, sku, category, manufacturer, stock_quantity, reorder_level, unit_price, expiry_date, generic_name, batch_no, rack_no, purchase_price, is_sheet, tablets_per_sheet, hsn_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`, [
        input.itemName, input.sku, input.category, input.manufacturer || null, input.stockQuantity, input.reorderLevel, input.unitPrice, input.expiryDate,
        input.genericName, input.batchNo, input.rackNo, input.purchasePrice, input.isSheet || false, input.tabletsPerSheet || 1, input.hsnCode || '30049099'
    ]);
    return result.rows[0];
};
exports.createInventoryItem = createInventoryItem;
const bulkCreateInventoryItems = async (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new errorHandler_1.AppError('No valid inventory items provided for bulk upload.', 400);
    }
    const insertedItems = [];
    const timestamp = Date.now();
    for (let i = 0; i < items.length; i++) {
        const raw = items[i];
        const itemName = String(raw.itemName || raw.item_name || raw.name || '').trim();
        if (!itemName)
            continue; // Skip blank rows
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
        }
        else {
            expiryDate = new Date(expiryDate).toISOString().split('T')[0];
        }
        const isSheet = String(raw.isSheet ?? raw.is_sheet ?? false).toLowerCase() === 'true' || raw.isSheet === true;
        const tabletsPerSheet = Math.max(1, Number(raw.tabletsPerSheet ?? raw.tablets_per_sheet ?? 1));
        const hsnCode = String(raw.hsnCode || raw.hsn_code || '30049099').trim();
        const result = await (0, database_1.query)(`INSERT INTO inventory_items (item_name, sku, category, manufacturer, stock_quantity, reorder_level, unit_price, expiry_date, generic_name, batch_no, rack_no, purchase_price, is_sheet, tablets_per_sheet, hsn_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`, [
            itemName, sku, category, manufacturer, stockQuantity, reorderLevel, unitPrice, expiryDate,
            genericName, batchNo, rackNo, purchasePrice, isSheet, tabletsPerSheet, hsnCode
        ]);
        if (result.rows.length > 0) {
            insertedItems.push(result.rows[0]);
        }
    }
    return {
        importedCount: insertedItems.length,
        items: insertedItems
    };
};
exports.bulkCreateInventoryItems = bulkCreateInventoryItems;
const updateInventoryItem = async (id, input) => {
    const fieldMap = {
        itemName: 'item_name', category: 'category', manufacturer: 'manufacturer',
        stockQuantity: 'stock_quantity', reorderLevel: 'reorder_level', unitPrice: 'unit_price', expiryDate: 'expiry_date',
        genericName: 'generic_name', batchNo: 'batch_no', rackNo: 'rack_no', purchasePrice: 'purchase_price',
        isSheet: 'is_sheet', tabletsPerSheet: 'tablets_per_sheet', hsnCode: 'hsn_code',
    };
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
        if (input[key] !== undefined) {
            fields.push(`${col} = $${idx}`);
            values.push(input[key]);
            idx++;
        }
    }
    if (fields.length === 0)
        throw new errorHandler_1.AppError('No fields to update.', 400);
    values.push(id);
    const result = await (0, database_1.query)(`UPDATE inventory_items SET ${fields.join(', ')} WHERE item_id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Inventory item not found.', 404);
    return result.rows[0];
};
exports.updateInventoryItem = updateInventoryItem;
const getLowStockItems = async () => {
    const result = await (0, database_1.query)('SELECT * FROM inventory_items WHERE stock_quantity <= reorder_level ORDER BY stock_quantity ASC');
    return result.rows;
};
exports.getLowStockItems = getLowStockItems;
const createSale = async (pharmacistId, input) => {
    const { patientId, paymentMethod, items } = input;
    await (0, database_1.query)('BEGIN');
    try {
        let subtotal = 0;
        let totalDiscount = 0;
        const itemDetails = [];
        for (const item of items) {
            const itemRes = await (0, database_1.query)('SELECT item_id, item_name, stock_quantity, unit_price, is_sheet, tablets_per_sheet, hsn_code, batch_no, expiry_date, generic_name FROM inventory_items WHERE item_id = $1', [item.itemId]);
            if (itemRes.rows.length === 0) {
                throw new errorHandler_1.AppError(`Item with ID ${item.itemId} not found.`, 404);
            }
            const dbItem = itemRes.rows[0];
            const sheetPrice = parseFloat(dbItem.unit_price);
            const isSheet = dbItem.is_sheet;
            const tabletsPerSheet = parseInt(dbItem.tablets_per_sheet, 10) || 1;
            const sellLoose = item.sellLoose && isSheet;
            let chargePrice;
            let stockDeduction;
            let unitLabel;
            if (sellLoose) {
                chargePrice = parseFloat((sheetPrice / tabletsPerSheet).toFixed(2));
                stockDeduction = parseFloat((item.quantity / tabletsPerSheet).toFixed(4));
                unitLabel = item.quantity === 1 ? 'Tablet' : 'Tablets';
            }
            else {
                chargePrice = sheetPrice;
                stockDeduction = item.quantity;
                unitLabel = isSheet ? (item.quantity === 1 ? 'Sheet' : 'Sheets') : 'Unit';
            }
            if (parseFloat(dbItem.stock_quantity) < stockDeduction) {
                throw new errorHandler_1.AppError(`Insufficient stock for ${dbItem.item_name}. Available: ${dbItem.stock_quantity}, Requested: ${stockDeduction}`, 400);
            }
            await (0, database_1.query)('UPDATE inventory_items SET stock_quantity = stock_quantity - $1 WHERE item_id = $2', [stockDeduction, item.itemId]);
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
            const pRes = await (0, database_1.query)('SELECT is_inpatient FROM patients WHERE patient_id = $1', [patientId]);
            if (pRes.rows.length > 0 && pRes.rows[0].is_inpatient) {
                isIp = true;
                const ipRes = await (0, database_1.query)(`SELECT admission_id as ip_admission_id FROM ip_admissions WHERE patient_id = $1 AND status != 'Discharged' ORDER BY created_at DESC LIMIT 1`, [patientId]);
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
        const invoiceRes = await (0, database_1.query)(`INSERT INTO invoices (patient_id, total_amount, discount, tax, patient_responsibility, amount_paid, status, payment_method, notes, created_by, ip_admission_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`, [patientId, total, totalDiscount, tax, total, finalAmountPaid, finalStatus, finalPaymentMethod, 'Direct pharmacy sale recorded by pharmacist', pharmacistId, ipAdmissionId]);
        const invoice = invoiceRes.rows[0];
        for (const details of itemDetails) {
            await (0, database_1.query)(`INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price, hsn_code, batch_no, expiry_date, composition, discount, unit)
         VALUES ($1, $2, 'Medication', $3, $4, $5, $6, $7, $8, $9, $10)`, [
                invoice.invoice_id,
                `${details.item_name} (${details.unit_label})`,
                details.quantity,
                details.charge_price,
                details.hsn_code,
                details.batch_no,
                details.expiry_date,
                details.composition,
                details.discount,
                details.unit_label
            ]);
        }
        await (0, database_1.query)('COMMIT');
        return invoice;
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        throw error;
    }
};
exports.createSale = createSale;
const getSalesHistory = async () => {
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
      p.medical_record_number as patient_mrn,
      u.first_name as pharmacist_first_name,
      u.last_name as pharmacist_last_name,
      u.email as pharmacist_email
    FROM invoices i
    LEFT JOIN patients p ON i.patient_id = p.patient_id
    LEFT JOIN users u ON i.created_by = u.user_id
    JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
    WHERE ii.category = 'Medication' OR i.notes LIKE '%pharmacy sale%'
    ORDER BY i.created_at DESC
  `;
    const salesRes = await (0, database_1.query)(salesQuery);
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
        const updateStats = (periodStats) => {
            periodStats.count++;
            periodStats.amount += amt;
            if (method === 'UPI') {
                periodStats.byMethod.UPI.count++;
                periodStats.byMethod.UPI.amount += amt;
            }
            else if (method === 'Card') {
                periodStats.byMethod.Card.count++;
                periodStats.byMethod.Card.amount += amt;
            }
            else if (method === 'Cash') {
                periodStats.byMethod.Cash.count++;
                periodStats.byMethod.Cash.amount += amt;
            }
            else if (method === 'Insurance') {
                periodStats.byMethod.Insurance.count++;
                periodStats.byMethod.Insurance.amount += amt;
            }
            else if (method === 'Bank Transfer') {
                periodStats.byMethod['Bank Transfer'].count++;
                periodStats.byMethod['Bank Transfer'].amount += amt;
            }
        };
        if (saleDate >= startOfDay)
            updateStats(stats.day);
        if (saleDate >= startOfWeek)
            updateStats(stats.week);
        if (saleDate >= startOfMonth)
            updateStats(stats.month);
    }
    return { sales, stats };
};
exports.getSalesHistory = getSalesHistory;
//# sourceMappingURL=inventory.service.js.map