"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qcLogSchema = exports.referralDoctorSchema = exports.machineSchema = exports.reportVerificationSchema = exports.ecgReportSchema = exports.ultrasoundReportSchema = exports.radiologyReportSchema = exports.labResultSchema = exports.sampleCollectionSchema = exports.orderSchema = exports.packageSchema = exports.serviceSchema = exports.parameterSchema = void 0;
const zod_1 = require("zod");
exports.parameterSchema = zod_1.z.object({
    parameterId: zod_1.z.string().optional().nullable(),
    name: zod_1.z.string().min(1),
    unit: zod_1.z.string().optional().nullable(),
    referenceRange: zod_1.z.string().optional().nullable(),
    inputType: zod_1.z.string().optional().nullable(),
    dropdownOptions: zod_1.z.string().optional().nullable(),
    minValue: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    maxValue: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    ageGroup: zod_1.z.string().optional().nullable(),
    gender: zod_1.z.string().optional().nullable(),
    refMinMale: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    refMaxMale: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    refMinFemale: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    refMaxFemale: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    refMinChild: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    refMaxChild: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    rowType: zod_1.z.string().optional().nullable()
});
exports.serviceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    categoryId: zod_1.z.string().uuid(),
    serviceCode: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    gstPercentage: zod_1.z.number().nonnegative().default(18.00),
    durationMinutes: zod_1.z.number().positive().default(30),
    sampleRequired: zod_1.z.string().optional().nullable(),
    normalRange: zod_1.z.string().optional().nullable(),
    machineRequired: zod_1.z.string().optional().nullable(),
    homeCollectionAvailable: zod_1.z.boolean().default(false),
    emergencyAvailable: zod_1.z.boolean().default(false),
    isActive: zod_1.z.boolean().default(true),
    reportType: zod_1.z.string().optional().default('Structured'),
    parameters: zod_1.z.array(exports.parameterSchema).optional()
});
exports.packageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    discount: zod_1.z.number().nonnegative().default(0),
    validityDays: zod_1.z.number().positive().default(365),
    services: zod_1.z.array(zod_1.z.string().uuid()).min(1)
});
exports.orderSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    doctorId: zod_1.z.string().uuid(),
    referralId: zod_1.z.string().uuid().optional().nullable(),
    priority: zod_1.z.enum(['Routine', 'Urgent', 'Emergency']).default('Routine'),
    clinicalNotes: zod_1.z.string().optional(),
    diagnosis: zod_1.z.string().optional(),
    services: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    packages: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
exports.sampleCollectionSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    containerType: zod_1.z.string().min(1),
    barcode: zod_1.z.string().min(1),
    remarks: zod_1.z.string().optional()
});
exports.labResultSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    actualResult: zod_1.z.string().min(1),
    referenceRange: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Normal', 'Low', 'High', 'Critical']).default('Normal'),
    machineReading: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
    machineId: zod_1.z.string().uuid().optional().nullable()
});
exports.radiologyReportSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    imageUrls: zod_1.z.array(zod_1.z.string()).optional(),
    findings: zod_1.z.string().min(1),
    impression: zod_1.z.string().min(1),
    conclusion: zod_1.z.string().optional(),
    radiographerId: zod_1.z.string().uuid().optional(),
    radiologistId: zod_1.z.string().uuid().optional()
});
exports.ultrasoundReportSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    clinicalHistory: zod_1.z.string().optional(),
    findings: zod_1.z.string().min(1),
    impression: zod_1.z.string().min(1),
    recommendations: zod_1.z.string().optional(),
    sonologistId: zod_1.z.string().uuid().optional()
});
exports.ecgReportSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    graphUrl: zod_1.z.string().optional(),
    findings: zod_1.z.string().min(1),
    interpretation: zod_1.z.string().min(1),
    recommendation: zod_1.z.string().optional(),
    operatorId: zod_1.z.string().uuid().optional(),
    doctorId: zod_1.z.string().uuid().optional()
});
exports.reportVerificationSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['Approved', 'Rejected', 'PendingRetest', 'Correction']),
    notes: zod_1.z.string().optional(),
    digitalSignatureUsed: zod_1.z.string().optional()
});
exports.machineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    manufacturer: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    serialNumber: zod_1.z.string().min(1),
    calibrationDate: zod_1.z.string().optional(),
    maintenanceDate: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    status: zod_1.z.string().default('Active')
});
exports.referralDoctorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    hospital: zod_1.z.string().optional(),
    commissionPercentage: zod_1.z.number().min(0).max(100).default(0),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional()
});
exports.qcLogSchema = zod_1.z.object({
    machineId: zod_1.z.string().uuid(),
    qcParameter: zod_1.z.string().min(1),
    expectedValue: zod_1.z.string().optional(),
    actualValue: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Pass', 'Fail']).default('Pass')
});
//# sourceMappingURL=diagnostics.schema.js.map