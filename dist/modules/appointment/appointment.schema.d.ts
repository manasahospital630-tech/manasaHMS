import { z } from 'zod';
export declare const createAppointmentSchema: z.ZodObject<{
    patientId: z.ZodString;
    doctorId: z.ZodString;
    appointmentDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    symptomsBrief: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    doctorId: string;
    appointmentDate?: string | undefined;
    symptomsBrief?: string | undefined;
    notes?: string | undefined;
}, {
    patientId: string;
    doctorId: string;
    appointmentDate?: string | undefined;
    symptomsBrief?: string | undefined;
    notes?: string | undefined;
}>;
export declare const updateAppointmentStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["Scheduled", "CheckedIn", "InConsultation", "Completed", "Cancelled"]>;
}, "strip", z.ZodTypeAny, {
    status: "Scheduled" | "CheckedIn" | "InConsultation" | "Completed" | "Cancelled";
}, {
    status: "Scheduled" | "CheckedIn" | "InConsultation" | "Completed" | "Cancelled";
}>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export declare const createOPCheckInSchema: z.ZodObject<{
    patientId: z.ZodString;
    doctorId: z.ZodString;
    paymentMethod: z.ZodString;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    doctorId: string;
    paymentMethod: string;
}, {
    patientId: string;
    doctorId: string;
    paymentMethod: string;
}>;
export type CreateOPCheckInInput = z.infer<typeof createOPCheckInSchema>;
//# sourceMappingURL=appointment.schema.d.ts.map