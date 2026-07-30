"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmergencyStatusSchema = exports.createEmergencyOrderSchema = exports.saveConsentSchema = exports.logVitalsSchema = exports.admitEmergencyPatientSchema = void 0;
const zod_1 = require("zod");
exports.admitEmergencyPatientSchema = zod_1.z.object({
    isUnknown: zod_1.z.boolean().default(false),
    patientName: zod_1.z.string().optional(),
    estimatedAge: zod_1.z.string().optional(),
    gender: zod_1.z.string(),
    physicalMarks: zod_1.z.string().optional(),
    belongingsInventory: zod_1.z.string().optional(),
    isMLC: zod_1.z.boolean().default(false),
    mlcCategory: zod_1.z.string().optional().nullable(),
    broughtBy: zod_1.z.object({
        name: zod_1.z.string(),
        phone: zod_1.z.string().optional(),
        relation: zod_1.z.string().optional(),
        policeBadgeNumber: zod_1.z.string().optional(),
        policeStation: zod_1.z.string().optional(),
        policeOfficerName: zod_1.z.string().optional()
    }).optional(),
    triagePriority: zod_1.z.enum(['RED', 'ORANGE', 'YELLOW', 'GREEN']).default('RED'),
    currentBedId: zod_1.z.string().uuid().optional().nullable(),
    admittingDoctorId: zod_1.z.string().uuid()
});
exports.logVitalsSchema = zod_1.z.object({
    emergencyId: zod_1.z.string().uuid(),
    bpSys: zod_1.z.number().int().optional().nullable(),
    bpDia: zod_1.z.number().int().optional().nullable(),
    pulse: zod_1.z.number().int().optional().nullable(),
    spo2: zod_1.z.number().int().optional().nullable(),
    respiratoryRate: zod_1.z.number().int().optional().nullable(),
    gcsScore: zod_1.z.number().int().min(3).max(15).optional().nullable()
});
exports.saveConsentSchema = zod_1.z.object({
    emergencyId: zod_1.z.string().uuid(),
    consentType: zod_1.z.enum(['HIGH_RISK', 'POLICE_INTIMATION', 'BROUGHT_BY_WITNESS', 'SELF_HARM_DECLARATION', 'LAMA']),
    signatoryName: zod_1.z.string().min(1),
    relation: zod_1.z.string().optional().nullable(),
    signatureDataUrl: zod_1.z.string().min(10)
});
exports.createEmergencyOrderSchema = zod_1.z.object({
    emergencyId: zod_1.z.string().uuid(),
    orderType: zod_1.z.enum(['MEDICATION', 'IV_FLUIDS', 'BLOOD_BANK', 'RADIOLOGY']),
    details: zod_1.z.string().min(1)
});
exports.updateEmergencyStatusSchema = zod_1.z.object({
    emergencyId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['IN_ER_CARE', 'IP_TRANSFERRED', 'DISCHARGED', 'MORTUARY']),
    currentBedId: zod_1.z.string().uuid().optional().nullable()
});
//# sourceMappingURL=emergency.schema.js.map