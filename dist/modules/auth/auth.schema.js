"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email({ message: 'A valid email address is required' })
        .max(255)
        .transform((val) => val.toLowerCase().trim()),
    password: zod_1.z
        .string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .max(128)
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    firstName: zod_1.z.string().min(1, { message: 'First name is required' }).max(100).trim(),
    lastName: zod_1.z.string().min(1, { message: 'Last name is required' }).max(100).trim(),
    phone: zod_1.z.string().max(20).optional(),
    role: zod_1.z.enum(['Admin', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Biller', 'Patient', 'Incharge'], {
        errorMap: () => ({ message: 'Invalid role. Must be one of: Admin, Management, Doctor, Nurse, Receptionist, Pharmacist, Biller, Patient, Incharge' }),
    }),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email({ message: 'A valid email address is required' })
        .transform((val) => val.toLowerCase().trim()),
    password: zod_1.z.string().min(1, { message: 'Password is required' }),
});
//# sourceMappingURL=auth.schema.js.map