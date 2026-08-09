"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDiagnosisSchema = exports.updateSoapSchema = exports.updateVitalsSchema = exports.createEncounterSchema = void 0;
const zod_1 = require("zod");
exports.createEncounterSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    appointmentId: zod_1.z.string().uuid().optional(),
    chiefComplaint: zod_1.z.string().min(1, { message: 'Chief complaint is required' }),
    systolicBp: zod_1.z.number().int().optional(),
    diastolicBp: zod_1.z.number().int().optional(),
    pulseRate: zod_1.z.number().int().optional(),
    temperatureCelsius: zod_1.z.number().optional(),
    weightKg: zod_1.z.number().optional(),
    heightCm: zod_1.z.number().optional(),
    spo2: zod_1.z.number().int().optional(),
    soapSubjective: zod_1.z.string().optional(),
    soapObjective: zod_1.z.string().optional(),
    soapAssessment: zod_1.z.string().optional(),
    soapPlan: zod_1.z.string().optional(),
});
exports.updateVitalsSchema = zod_1.z.object({
    systolicBp: zod_1.z.number().int().optional(),
    diastolicBp: zod_1.z.number().int().optional(),
    pulseRate: zod_1.z.number().int().optional(),
    temperatureCelsius: zod_1.z.number().optional(),
    weightKg: zod_1.z.number().optional(),
    heightCm: zod_1.z.number().optional(),
    spo2: zod_1.z.number().int().optional(),
    chiefComplaint: zod_1.z.string().optional(),
});
exports.updateSoapSchema = zod_1.z.object({
    soapSubjective: zod_1.z.string().optional(),
    soapObjective: zod_1.z.string().optional(),
    soapAssessment: zod_1.z.string().optional(),
    soapPlan: zod_1.z.string().optional(),
});
exports.addDiagnosisSchema = zod_1.z.object({
    icdCode: zod_1.z.string().min(1, { message: 'ICD code is required' }),
    description: zod_1.z.string().min(1, { message: 'Description is required' }),
    isPrimary: zod_1.z.boolean().optional().default(false),
});
//# sourceMappingURL=emr.schema.js.map