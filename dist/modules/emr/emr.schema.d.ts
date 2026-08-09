import { z } from 'zod';
export declare const createEncounterSchema: z.ZodObject<{
    patientId: z.ZodString;
    appointmentId: z.ZodOptional<z.ZodString>;
    chiefComplaint: z.ZodString;
    systolicBp: z.ZodOptional<z.ZodNumber>;
    diastolicBp: z.ZodOptional<z.ZodNumber>;
    pulseRate: z.ZodOptional<z.ZodNumber>;
    temperatureCelsius: z.ZodOptional<z.ZodNumber>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    heightCm: z.ZodOptional<z.ZodNumber>;
    spo2: z.ZodOptional<z.ZodNumber>;
    soapSubjective: z.ZodOptional<z.ZodString>;
    soapObjective: z.ZodOptional<z.ZodString>;
    soapAssessment: z.ZodOptional<z.ZodString>;
    soapPlan: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    chiefComplaint: string;
    appointmentId?: string | undefined;
    systolicBp?: number | undefined;
    diastolicBp?: number | undefined;
    pulseRate?: number | undefined;
    temperatureCelsius?: number | undefined;
    weightKg?: number | undefined;
    heightCm?: number | undefined;
    spo2?: number | undefined;
    soapSubjective?: string | undefined;
    soapObjective?: string | undefined;
    soapAssessment?: string | undefined;
    soapPlan?: string | undefined;
}, {
    patientId: string;
    chiefComplaint: string;
    appointmentId?: string | undefined;
    systolicBp?: number | undefined;
    diastolicBp?: number | undefined;
    pulseRate?: number | undefined;
    temperatureCelsius?: number | undefined;
    weightKg?: number | undefined;
    heightCm?: number | undefined;
    spo2?: number | undefined;
    soapSubjective?: string | undefined;
    soapObjective?: string | undefined;
    soapAssessment?: string | undefined;
    soapPlan?: string | undefined;
}>;
export declare const updateVitalsSchema: z.ZodObject<{
    systolicBp: z.ZodOptional<z.ZodNumber>;
    diastolicBp: z.ZodOptional<z.ZodNumber>;
    pulseRate: z.ZodOptional<z.ZodNumber>;
    temperatureCelsius: z.ZodOptional<z.ZodNumber>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    heightCm: z.ZodOptional<z.ZodNumber>;
    spo2: z.ZodOptional<z.ZodNumber>;
    chiefComplaint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    chiefComplaint?: string | undefined;
    systolicBp?: number | undefined;
    diastolicBp?: number | undefined;
    pulseRate?: number | undefined;
    temperatureCelsius?: number | undefined;
    weightKg?: number | undefined;
    heightCm?: number | undefined;
    spo2?: number | undefined;
}, {
    chiefComplaint?: string | undefined;
    systolicBp?: number | undefined;
    diastolicBp?: number | undefined;
    pulseRate?: number | undefined;
    temperatureCelsius?: number | undefined;
    weightKg?: number | undefined;
    heightCm?: number | undefined;
    spo2?: number | undefined;
}>;
export declare const updateSoapSchema: z.ZodObject<{
    soapSubjective: z.ZodOptional<z.ZodString>;
    soapObjective: z.ZodOptional<z.ZodString>;
    soapAssessment: z.ZodOptional<z.ZodString>;
    soapPlan: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    soapSubjective?: string | undefined;
    soapObjective?: string | undefined;
    soapAssessment?: string | undefined;
    soapPlan?: string | undefined;
}, {
    soapSubjective?: string | undefined;
    soapObjective?: string | undefined;
    soapAssessment?: string | undefined;
    soapPlan?: string | undefined;
}>;
export declare const addDiagnosisSchema: z.ZodObject<{
    icdCode: z.ZodString;
    description: z.ZodString;
    isPrimary: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    icdCode: string;
    isPrimary: boolean;
}, {
    description: string;
    icdCode: string;
    isPrimary?: boolean | undefined;
}>;
export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type UpdateVitalsInput = z.infer<typeof updateVitalsSchema>;
export type UpdateSoapInput = z.infer<typeof updateSoapSchema>;
export type AddDiagnosisInput = z.infer<typeof addDiagnosisSchema>;
//# sourceMappingURL=emr.schema.d.ts.map