import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().max(255).transform((val) => val.toLowerCase().trim()),
  password: z.string().min(6).max(128),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional().or(z.literal('')),
  role: z.string().min(1).max(100).trim(),
  department: z.string().max(100).optional().or(z.literal('')),
  specialization: z.string().max(100).optional().or(z.literal('')),
  licenseNumber: z.string().max(100).optional().or(z.literal('')),
  consultationFee: z.union([z.number(), z.string()]).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().max(255).optional().or(z.literal('')),
  password: z.string().min(6).max(128).optional().or(z.literal('')),
  role: z.string().min(1).max(100).optional(),
  isActive: z.union([z.boolean(), z.number(), z.string()]).transform((val) => val === true || val === 1 || val === '1' || val === 'true').optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  specialization: z.string().max(100).optional().or(z.literal('')),
  licenseNumber: z.string().max(100).optional().or(z.literal('')),
  consultationFee: z.union([z.number(), z.string()]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const upsertDoctorProfileSchema = z.object({
  doctorId: z.string().uuid(),
  department: z.string().min(1).max(100),
  consultationFee: z.number().min(0),
});

export type UpsertDoctorProfileInput = z.infer<typeof upsertDoctorProfileSchema>;

