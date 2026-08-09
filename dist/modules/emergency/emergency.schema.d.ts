import { z } from 'zod';
export declare const admitEmergencyPatientSchema: z.ZodObject<{
    isUnknown: z.ZodDefault<z.ZodBoolean>;
    patientName: z.ZodOptional<z.ZodString>;
    estimatedAge: z.ZodOptional<z.ZodString>;
    gender: z.ZodString;
    physicalMarks: z.ZodOptional<z.ZodString>;
    belongingsInventory: z.ZodOptional<z.ZodString>;
    isMLC: z.ZodDefault<z.ZodBoolean>;
    mlcCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    broughtBy: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        relation: z.ZodOptional<z.ZodString>;
        policeBadgeNumber: z.ZodOptional<z.ZodString>;
        policeStation: z.ZodOptional<z.ZodString>;
        policeOfficerName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone?: string | undefined;
        relation?: string | undefined;
        policeBadgeNumber?: string | undefined;
        policeStation?: string | undefined;
        policeOfficerName?: string | undefined;
    }, {
        name: string;
        phone?: string | undefined;
        relation?: string | undefined;
        policeBadgeNumber?: string | undefined;
        policeStation?: string | undefined;
        policeOfficerName?: string | undefined;
    }>>;
    triagePriority: z.ZodDefault<z.ZodEnum<["RED", "ORANGE", "YELLOW", "GREEN"]>>;
    currentBedId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    admittingDoctorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gender: string;
    admittingDoctorId: string;
    isUnknown: boolean;
    isMLC: boolean;
    triagePriority: "RED" | "ORANGE" | "YELLOW" | "GREEN";
    patientName?: string | undefined;
    estimatedAge?: string | undefined;
    physicalMarks?: string | undefined;
    belongingsInventory?: string | undefined;
    mlcCategory?: string | null | undefined;
    broughtBy?: {
        name: string;
        phone?: string | undefined;
        relation?: string | undefined;
        policeBadgeNumber?: string | undefined;
        policeStation?: string | undefined;
        policeOfficerName?: string | undefined;
    } | undefined;
    currentBedId?: string | null | undefined;
}, {
    gender: string;
    admittingDoctorId: string;
    isUnknown?: boolean | undefined;
    patientName?: string | undefined;
    estimatedAge?: string | undefined;
    physicalMarks?: string | undefined;
    belongingsInventory?: string | undefined;
    isMLC?: boolean | undefined;
    mlcCategory?: string | null | undefined;
    broughtBy?: {
        name: string;
        phone?: string | undefined;
        relation?: string | undefined;
        policeBadgeNumber?: string | undefined;
        policeStation?: string | undefined;
        policeOfficerName?: string | undefined;
    } | undefined;
    triagePriority?: "RED" | "ORANGE" | "YELLOW" | "GREEN" | undefined;
    currentBedId?: string | null | undefined;
}>;
export declare const logVitalsSchema: z.ZodObject<{
    emergencyId: z.ZodString;
    bpSys: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    bpDia: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    pulse: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    spo2: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    respiratoryRate: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gcsScore: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    emergencyId: string;
    spo2?: number | null | undefined;
    bpSys?: number | null | undefined;
    bpDia?: number | null | undefined;
    pulse?: number | null | undefined;
    respiratoryRate?: number | null | undefined;
    gcsScore?: number | null | undefined;
}, {
    emergencyId: string;
    spo2?: number | null | undefined;
    bpSys?: number | null | undefined;
    bpDia?: number | null | undefined;
    pulse?: number | null | undefined;
    respiratoryRate?: number | null | undefined;
    gcsScore?: number | null | undefined;
}>;
export declare const saveConsentSchema: z.ZodObject<{
    emergencyId: z.ZodString;
    consentType: z.ZodEnum<["HIGH_RISK", "POLICE_INTIMATION", "BROUGHT_BY_WITNESS", "SELF_HARM_DECLARATION", "LAMA"]>;
    signatoryName: z.ZodString;
    relation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    signatureDataUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    emergencyId: string;
    consentType: "HIGH_RISK" | "POLICE_INTIMATION" | "BROUGHT_BY_WITNESS" | "SELF_HARM_DECLARATION" | "LAMA";
    signatoryName: string;
    signatureDataUrl: string;
    relation?: string | null | undefined;
}, {
    emergencyId: string;
    consentType: "HIGH_RISK" | "POLICE_INTIMATION" | "BROUGHT_BY_WITNESS" | "SELF_HARM_DECLARATION" | "LAMA";
    signatoryName: string;
    signatureDataUrl: string;
    relation?: string | null | undefined;
}>;
export declare const createEmergencyOrderSchema: z.ZodObject<{
    emergencyId: z.ZodString;
    orderType: z.ZodEnum<["MEDICATION", "IV_FLUIDS", "BLOOD_BANK", "RADIOLOGY"]>;
    details: z.ZodString;
}, "strip", z.ZodTypeAny, {
    emergencyId: string;
    orderType: "MEDICATION" | "IV_FLUIDS" | "BLOOD_BANK" | "RADIOLOGY";
    details: string;
}, {
    emergencyId: string;
    orderType: "MEDICATION" | "IV_FLUIDS" | "BLOOD_BANK" | "RADIOLOGY";
    details: string;
}>;
export declare const updateEmergencyStatusSchema: z.ZodObject<{
    emergencyId: z.ZodString;
    status: z.ZodEnum<["IN_ER_CARE", "IP_TRANSFERRED", "DISCHARGED", "MORTUARY"]>;
    currentBedId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "DISCHARGED" | "MORTUARY" | "IN_ER_CARE" | "IP_TRANSFERRED";
    emergencyId: string;
    currentBedId?: string | null | undefined;
}, {
    status: "DISCHARGED" | "MORTUARY" | "IN_ER_CARE" | "IP_TRANSFERRED";
    emergencyId: string;
    currentBedId?: string | null | undefined;
}>;
//# sourceMappingURL=emergency.schema.d.ts.map