"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bedSchema = exports.transferBedSchema = exports.emergencyFastTrackSchema = exports.routineAdmissionSchema = void 0;
const zod_1 = require("zod");
exports.routineAdmissionSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    admissionType: zod_1.z.enum(['Routine_IP', 'Emergency']),
    admittingDoctorId: zod_1.z.string().uuid(),
    targetBedId: zod_1.z.string().uuid(),
    reasonForAdmission: zod_1.z.string().min(5)
});
exports.emergencyFastTrackSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    emergencyContact: zod_1.z.string().optional(),
    admissionType: zod_1.z.enum(['Emergency']),
    admittingDoctorId: zod_1.z.string().uuid(),
    targetBedId: zod_1.z.string().uuid(),
    reasonForAdmission: zod_1.z.string().min(5),
    chiefComplaint: zod_1.z.string().min(5)
});
exports.transferBedSchema = zod_1.z.object({
    ipAdmissionId: zod_1.z.string().uuid(),
    targetBedId: zod_1.z.string().uuid(),
    transferReason: zod_1.z.string().min(5)
});
exports.bedSchema = zod_1.z.object({
    bedNumber: zod_1.z.string().min(1),
    wardName: zod_1.z.string().min(1),
    type: zod_1.z.enum(['Emergency', 'ICU', 'General_Ward', 'Semi_Private', 'Private_Suite']),
    status: zod_1.z.enum(['Available', 'Occupied', 'Maintenance']).default('Available'),
    perDayCharge: zod_1.z.number().positive(),
    floor: zod_1.z.string().min(1).default('1st Floor')
});
//# sourceMappingURL=ip.schema.js.map