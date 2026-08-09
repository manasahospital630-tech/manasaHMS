import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  itemName: z.string().min(1).max(200),
  sku: z.string().min(1).max(100),
  category: z.string().max(100).optional().default('General'),
  manufacturer: z.string().max(200).optional(),
  stockQuantity: z.number().min(0),
  reorderLevel: z.number().int().min(0).optional().default(50),
  unitPrice: z.number().min(0),
  expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid expiry date required' }),
  genericName: z.string().min(1, { message: 'Generic name is required' }).max(200),
  batchNo: z.string().min(1, { message: 'Batch number is required' }).max(100),
  rackNo: z.string().min(1, { message: 'Rack number is required' }).max(50),
  purchasePrice: z.number().min(0),
  isSheet: z.boolean().optional().default(false),
  tabletsPerSheet: z.number().int().min(1).optional().default(1),
  hsnCode: z.string().max(50).optional().default('30049099'),
});

export const updateInventoryItemSchema = z.object({
  itemName: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),
  stockQuantity: z.number().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  expiryDate: z.string().optional(),
  genericName: z.string().min(1).max(200).optional(),
  batchNo: z.string().min(1).max(100).optional(),
  rackNo: z.string().min(1).max(50).optional(),
  purchasePrice: z.number().min(0).optional(),
  isSheet: z.boolean().optional(),
  tabletsPerSheet: z.number().int().min(1).optional(),
  hsnCode: z.string().max(50).optional(),
});

export const createPrescriptionSchema = z.object({
  encounterId: z.string().min(1, { message: 'Encounter ID is required' }),
  patientId: z.string().min(1, { message: 'Patient ID is required' }),
  items: z.array(z.object({
    itemId: z.string().min(1, { message: 'Item ID is required' }),
    dosageInstruction: z.string().min(1),
    quantityPrescribed: z.number().int().min(1),
  })).min(1, { message: 'At least one prescription item is required' }),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const createSaleSchema = z.object({
  patientId: z.string().min(1, { message: 'Patient ID is required' }),
  paymentMethod: z.enum(['Cash', 'Card', 'Insurance', 'Bank Transfer', 'UPI', 'IP Ledger']),
  items: z.array(z.object({
    itemId: z.string().min(1, { message: 'Item ID is required' }),
    quantity: z.number().int().min(1),
    sellLoose: z.preprocess(
      (val) => typeof val === 'number' ? Boolean(val) : val,
      z.boolean().optional().default(false)
    ),
    discount: z.number().min(0).optional().default(0),
  })).min(1, { message: 'At least one item is required' }),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

