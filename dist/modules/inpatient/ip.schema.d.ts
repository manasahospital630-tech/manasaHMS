import { z } from 'zod';
export declare const routineAdmissionSchema: z.ZodObject<{
    patientId: z.ZodString;
    admissionType: z.ZodEnum<["Routine_IP", "Emergency"]>;
    admittingDoctorId: z.ZodString;
    targetBedId: z.ZodString;
    reasonForAdmission: z.ZodString;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    admissionType: "Routine_IP" | "Emergency";
    admittingDoctorId: string;
    targetBedId: string;
    reasonForAdmission: string;
}, {
    patientId: string;
    admissionType: "Routine_IP" | "Emergency";
    admittingDoctorId: string;
    targetBedId: string;
    reasonForAdmission: string;
}>;
export declare const emergencyFastTrackSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    emergencyContact: z.ZodOptional<z.ZodString>;
    admissionType: z.ZodEnum<["Emergency"]>;
    admittingDoctorId: z.ZodString;
    targetBedId: z.ZodString;
    reasonForAdmission: z.ZodString;
    chiefComplaint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    chiefComplaint: string;
    admissionType: "Emergency";
    admittingDoctorId: string;
    targetBedId: string;
    reasonForAdmission: string;
    emergencyContact?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    chiefComplaint: string;
    admissionType: "Emergency";
    admittingDoctorId: string;
    targetBedId: string;
    reasonForAdmission: string;
    emergencyContact?: string | undefined;
}>;
export declare const transferBedSchema: z.ZodObject<{
    ipAdmissionId: z.ZodString;
    targetBedId: z.ZodString;
    transferReason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ipAdmissionId: string;
    targetBedId: string;
    transferReason: string;
}, {
    ipAdmissionId: string;
    targetBedId: string;
    transferReason: string;
}>;
export declare const bedSchema: z.ZodObject<{
    bedNumber: z.ZodString;
    wardName: z.ZodString;
    wardType: z.ZodDefault<z.ZodEnum<["Emergency", "ICU", "General", "Semi_Private", "Private_Suite"]>>;
    status: z.ZodDefault<z.ZodEnum<["Available", "Occupied", "Maintenance"]>>;
    dailyRate: z.ZodDefault<z.ZodNumber>;
    floor: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "Available" | "Occupied" | "Maintenance";
    bedNumber: string;
    wardName: string;
    wardType: "General" | "Emergency" | "ICU" | "Semi_Private" | "Private_Suite";
    dailyRate: number;
    floor: number;
}, {
    bedNumber: string;
    wardName: string;
    status?: "Available" | "Occupied" | "Maintenance" | undefined;
    wardType?: "General" | "Emergency" | "ICU" | "Semi_Private" | "Private_Suite" | undefined;
    dailyRate?: number | undefined;
    floor?: number | undefined;
}>;
export type RoutineAdmissionInput = z.infer<typeof routineAdmissionSchema>;
export type EmergencyFastTrackInput = z.infer<typeof emergencyFastTrackSchema>;
export type TransferBedInput = z.infer<typeof transferBedSchema>;
export type BedInput = z.infer<typeof bedSchema>;
//# sourceMappingURL=ip.schema.d.ts.map