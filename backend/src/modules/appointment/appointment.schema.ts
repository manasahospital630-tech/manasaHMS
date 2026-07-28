import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, { message: 'Valid patient ID is required' }),
  doctorId: z.string().min(1, { message: 'Valid doctor ID is required' }),
  appointmentDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Valid appointment date is required' }),
  symptomsBrief: z.string().max(500).optional(),
  notes: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['Scheduled', 'CheckedIn', 'InConsultation', 'Completed', 'Cancelled'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export const createOPCheckInSchema = z.object({
  patientId: z.string().min(1, { message: 'Valid patient ID is required' }),
  doctorId: z.string().min(1, { message: 'Valid doctor ID is required' }),
  paymentMethod: z.string().min(1, { message: 'Payment method is required' }),
});

export type CreateOPCheckInInput = z.infer<typeof createOPCheckInSchema>;
