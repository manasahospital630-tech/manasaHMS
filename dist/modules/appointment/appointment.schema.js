"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOPCheckInSchema = exports.updateAppointmentStatusSchema = exports.createAppointmentSchema = void 0;
const zod_1 = require("zod");
exports.createAppointmentSchema = zod_1.z.object({
    patientId: zod_1.z.string().min(1, { message: 'Valid patient ID is required' }),
    doctorId: zod_1.z.string().min(1, { message: 'Valid doctor ID is required' }),
    appointmentDate: zod_1.z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Valid appointment date is required' }),
    symptomsBrief: zod_1.z.string().max(500).optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateAppointmentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Scheduled', 'CheckedIn', 'InConsultation', 'Completed', 'Cancelled'], {
        errorMap: () => ({ message: 'Invalid status' }),
    }),
});
exports.createOPCheckInSchema = zod_1.z.object({
    patientId: zod_1.z.string().min(1, { message: 'Valid patient ID is required' }),
    doctorId: zod_1.z.string().min(1, { message: 'Valid doctor ID is required' }),
    paymentMethod: zod_1.z.string().min(1, { message: 'Payment method is required' }),
});
//# sourceMappingURL=appointment.schema.js.map