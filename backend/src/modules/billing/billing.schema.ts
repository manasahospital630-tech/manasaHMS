import { z } from 'zod';

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    category: z.string().optional().default('General'),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  discount: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  insuranceCoverage: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  paymentStatus: z.enum(['Paid', 'Unpaid', 'PartiallyPaid']).optional().default('Unpaid'),
  paymentMethod: z.string().optional(),
  paidAmount: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
});

export const recordPaymentSchema = z.object({
  amountPaid: z.number().min(0.01, { message: 'Payment amount must be positive' }),
  paymentMethod: z.string().min(1, { message: 'Payment method is required' }),
  transactionRef: z.string().optional(),
  paymentTimestamp: z.string().optional(),
  collectedBy: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
