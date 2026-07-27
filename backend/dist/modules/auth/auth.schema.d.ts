import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["Admin", "Management", "Doctor", "Nurse", "Receptionist", "Pharmacist", "Biller", "Patient", "Incharge"]>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "Admin" | "Management" | "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "Biller" | "Patient" | "Incharge";
    phone?: string | undefined;
}, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "Admin" | "Management" | "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "Biller" | "Patient" | "Incharge";
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
//# sourceMappingURL=auth.schema.d.ts.map