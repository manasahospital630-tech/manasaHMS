"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = exports.createPrescriptionSchema = exports.updateInventoryItemSchema = exports.createInventoryItemSchema = void 0;
const zod_1 = require("zod");
exports.createInventoryItemSchema = zod_1.z.object({
    itemName: zod_1.z.string().min(1).max(200),
    sku: zod_1.z.string().min(1).max(100),
    category: zod_1.z.string().max(100).optional().default('General'),
    manufacturer: zod_1.z.string().max(200).optional(),
    stockQuantity: zod_1.z.number().min(0),
    reorderLevel: zod_1.z.number().int().min(0).optional().default(50),
    unitPrice: zod_1.z.number().min(0),
    expiryDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid expiry date required' }),
    genericName: zod_1.z.string().min(1, { message: 'Generic name is required' }).max(200),
    batchNo: zod_1.z.string().min(1, { message: 'Batch number is required' }).max(100),
    rackNo: zod_1.z.string().min(1, { message: 'Rack number is required' }).max(50),
    purchasePrice: zod_1.z.number().min(0),
    isSheet: zod_1.z.boolean().optional().default(false),
    tabletsPerSheet: zod_1.z.number().int().min(1).optional().default(1),
    hsnCode: zod_1.z.string().max(50).optional().default('30049099'),
});
exports.updateInventoryItemSchema = zod_1.z.object({
    itemName: zod_1.z.string().min(1).max(200).optional(),
    category: zod_1.z.string().max(100).optional(),
    manufacturer: zod_1.z.string().max(200).optional(),
    stockQuantity: zod_1.z.number().min(0).optional(),
    reorderLevel: zod_1.z.number().int().min(0).optional(),
    unitPrice: zod_1.z.number().min(0).optional(),
    expiryDate: zod_1.z.string().optional(),
    genericName: zod_1.z.string().min(1).max(200).optional(),
    batchNo: zod_1.z.string().min(1).max(100).optional(),
    rackNo: zod_1.z.string().min(1).max(50).optional(),
    purchasePrice: zod_1.z.number().min(0).optional(),
    isSheet: zod_1.z.boolean().optional(),
    tabletsPerSheet: zod_1.z.number().int().min(1).optional(),
    hsnCode: zod_1.z.string().max(50).optional(),
});
exports.createPrescriptionSchema = zod_1.z.object({
    encounterId: zod_1.z.string().uuid(),
    patientId: zod_1.z.string().uuid(),
    items: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().uuid(),
        dosageInstruction: zod_1.z.string().min(1),
        quantityPrescribed: zod_1.z.number().int().min(1),
    })).min(1, { message: 'At least one prescription item is required' }),
});
exports.createSaleSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    paymentMethod: zod_1.z.enum(['Cash', 'Card', 'Insurance', 'Bank Transfer', 'UPI', 'IP Ledger']),
    items: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().int().min(1),
        sellLoose: zod_1.z.boolean().optional().default(false),
        discount: zod_1.z.number().min(0).optional().default(0),
    })).min(1, { message: 'At least one item is required' }),
});
//# sourceMappingURL=pharmacy.schema.js.map