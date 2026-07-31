import { z } from 'zod';

export const routineAdmissionSchema = z.object({
  patientId: z.string().min(1),
  admissionType: z.enum(['Routine_IP', 'Emergency']),
  admittingDoctorId: z.string().min(1),
  targetBedId: z.string().min(1),
  reasonForAdmission: z.string().min(5)
});

export const emergencyFastTrackSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  emergencyContact: z.string().optional(),
  admissionType: z.enum(['Emergency']),
  admittingDoctorId: z.string().min(1),
  targetBedId: z.string().min(1),
  reasonForAdmission: z.string().min(5),
  chiefComplaint: z.string().min(5)
});

export const transferBedSchema = z.object({
  ipAdmissionId: z.string().min(1),
  targetBedId: z.string().min(1),
  transferReason: z.string().min(5)
});

export const bedSchema = z.object({
  bedNumber: z.string().min(1),
  wardName: z.string().min(1),
  wardType: z.enum(['Emergency', 'ICU', 'General', 'Semi_Private', 'Private_Suite']).default('General'),
  status: z.enum(['Available', 'Occupied', 'Maintenance']).default('Available'),
  dailyRate: z.number().positive().default(1500),
  floor: z.coerce.number().int().min(0).default(1)
});

export type RoutineAdmissionInput = z.infer<typeof routineAdmissionSchema>;
export type EmergencyFastTrackInput = z.infer<typeof emergencyFastTrackSchema>;
export type TransferBedInput = z.infer<typeof transferBedSchema>;
export type BedInput = z.infer<typeof bedSchema>;


