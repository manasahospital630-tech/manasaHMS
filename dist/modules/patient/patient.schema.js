"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePatientSchema = exports.createPatientSchema = void 0;
const zod_1 = require("zod");
exports.createPatientSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, { message: 'First name is required' }).max(100).trim(),
    lastName: zod_1.z.string().min(1, { message: 'Last name is required' }).max(100).trim(),
    age: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date of birth is required' }).optional().or(zod_1.z.literal('')),
    gender: zod_1.z.string().min(1, { message: 'Gender is required' }).max(20),
    bloodGroup: zod_1.z.string().max(5).optional(),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email().max(255).optional().or(zod_1.z.literal('')),
    emergencyContactName: zod_1.z.string().max(150).optional(),
    emergencyContactPhone: zod_1.z.string().max(20).optional(),
    insuranceProvider: zod_1.z.string().max(200).optional(),
    insurancePolicyNumber: zod_1.z.string().max(100).optional(),
    allergies: zod_1.z.string().optional(),
    userId: zod_1.z.string().uuid().optional(),
    assignedDoctorId: zod_1.z.string().uuid().optional().nullable(),
    referredBy: zod_1.z.string().max(255).optional(),
});
exports.updatePatientSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).trim().optional(),
    lastName: zod_1.z.string().min(1).max(100).trim().optional(),
    age: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date is required' }).optional().or(zod_1.z.literal('')),
    gender: zod_1.z.string().max(20).optional(),
    bloodGroup: zod_1.z.string().max(5).optional(),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email().max(255).optional().or(zod_1.z.literal('')),
    emergencyContactName: zod_1.z.string().max(150).optional(),
    emergencyContactPhone: zod_1.z.string().max(20).optional(),
    insuranceProvider: zod_1.z.string().max(200).optional(),
    insurancePolicyNumber: zod_1.z.string().max(100).optional(),
    allergies: zod_1.z.string().optional(),
    assignedDoctorId: zod_1.z.string().uuid().optional().nullable(),
    referredBy: zod_1.z.string().max(255).optional(),
});
//# sourceMappingURL=patient.schema.js.map