import { z } from 'zod';

export const admitEmergencyPatientSchema = z.object({
  isUnknown: z.boolean().default(false),
  patientName: z.string().optional(),
  estimatedAge: z.string().optional(),
  gender: z.string(),
  physicalMarks: z.string().optional(),
  belongingsInventory: z.string().optional(),
  isMLC: z.boolean().default(false),
  mlcCategory: z.string().optional().nullable(),
  broughtBy: z.object({
    name: z.string(),
    phone: z.string().optional(),
    relation: z.string().optional(),
    policeBadgeNumber: z.string().optional(),
    policeStation: z.string().optional(),
    policeOfficerName: z.string().optional()
  }).optional(),
  triagePriority: z.enum(['RED', 'ORANGE', 'YELLOW', 'GREEN']).default('RED'),
  currentBedId: z.string().optional().nullable(),
  admittingDoctorId: z.string().min(1)
});

export const logVitalsSchema = z.object({
  emergencyId: z.string().min(1),
  bpSys: z.number().int().optional().nullable(),
  bpDia: z.number().int().optional().nullable(),
  pulse: z.number().int().optional().nullable(),
  spo2: z.number().int().optional().nullable(),
  respiratoryRate: z.number().int().optional().nullable(),
  gcsScore: z.number().int().min(3).max(15).optional().nullable()
});

export const saveConsentSchema = z.object({
  emergencyId: z.string().min(1),
  consentType: z.enum(['HIGH_RISK', 'POLICE_INTIMATION', 'BROUGHT_BY_WITNESS', 'SELF_HARM_DECLARATION', 'LAMA']),
  signatoryName: z.string().min(1),
  relation: z.string().optional().nullable(),
  signatureDataUrl: z.string().min(10)
});

export const createEmergencyOrderSchema = z.object({
  emergencyId: z.string().min(1),
  orderType: z.enum(['MEDICATION', 'IV_FLUIDS', 'BLOOD_BANK', 'RADIOLOGY']),
  details: z.string().min(1)
});

export const updateEmergencyStatusSchema = z.object({
  emergencyId: z.string().min(1),
  status: z.enum(['IN_ER_CARE', 'IP_TRANSFERRED', 'DISCHARGED', 'MORTUARY']),
  currentBedId: z.string().optional().nullable()
});
