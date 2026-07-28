import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    role: z.ZodString;
    department: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    specialization: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    licenseNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    consultationFee: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string | undefined;
    department?: string | undefined;
    specialization?: string | undefined;
    licenseNumber?: string | undefined;
    consultationFee?: string | number | undefined;
}, {
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string | undefined;
    department?: string | undefined;
    specialization?: string | undefined;
    licenseNumber?: string | undefined;
    consultationFee?: string | number | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    password: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    role: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    department: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    specialization: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    licenseNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    consultationFee: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    password?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    role?: string | undefined;
    department?: string | undefined;
    specialization?: string | undefined;
    licenseNumber?: string | undefined;
    consultationFee?: string | number | undefined;
    isActive?: boolean | undefined;
}, {
    password?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    role?: string | undefined;
    department?: string | undefined;
    specialization?: string | undefined;
    licenseNumber?: string | undefined;
    consultationFee?: string | number | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export declare const upsertDoctorProfileSchema: z.ZodObject<{
    doctorId: z.ZodString;
    department: z.ZodString;
    consultationFee: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    doctorId: string;
    department: string;
    consultationFee: number;
}, {
    doctorId: string;
    department: string;
    consultationFee: number;
}>;
export type UpsertDoctorProfileInput = z.infer<typeof upsertDoctorProfileSchema>;
//# sourceMappingURL=admin.schema.d.ts.map