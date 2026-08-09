import { z } from 'zod';
export declare const parameterSchema: z.ZodObject<{
    parameterId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    referenceRange: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    inputType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dropdownOptions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    minValue: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    maxValue: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    ageGroup: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gender: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    refMinMale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    refMaxMale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    refMinFemale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    refMaxFemale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    refMinChild: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    refMaxChild: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    rowType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    gender?: string | null | undefined;
    parameterId?: string | null | undefined;
    unit?: string | null | undefined;
    referenceRange?: string | null | undefined;
    inputType?: string | null | undefined;
    dropdownOptions?: string | null | undefined;
    minValue?: string | number | null | undefined;
    maxValue?: string | number | null | undefined;
    ageGroup?: string | null | undefined;
    refMinMale?: string | number | null | undefined;
    refMaxMale?: string | number | null | undefined;
    refMinFemale?: string | number | null | undefined;
    refMaxFemale?: string | number | null | undefined;
    refMinChild?: string | number | null | undefined;
    refMaxChild?: string | number | null | undefined;
    rowType?: string | null | undefined;
}, {
    name: string;
    gender?: string | null | undefined;
    parameterId?: string | null | undefined;
    unit?: string | null | undefined;
    referenceRange?: string | null | undefined;
    inputType?: string | null | undefined;
    dropdownOptions?: string | null | undefined;
    minValue?: string | number | null | undefined;
    maxValue?: string | number | null | undefined;
    ageGroup?: string | null | undefined;
    refMinMale?: string | number | null | undefined;
    refMaxMale?: string | number | null | undefined;
    refMinFemale?: string | number | null | undefined;
    refMaxFemale?: string | number | null | undefined;
    refMinChild?: string | number | null | undefined;
    refMaxChild?: string | number | null | undefined;
    rowType?: string | null | undefined;
}>;
export declare const serviceSchema: z.ZodObject<{
    name: z.ZodString;
    categoryId: z.ZodString;
    serviceCode: z.ZodString;
    price: z.ZodNumber;
    gstPercentage: z.ZodDefault<z.ZodNumber>;
    durationMinutes: z.ZodDefault<z.ZodNumber>;
    sampleRequired: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    normalRange: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    machineRequired: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    homeCollectionAvailable: z.ZodDefault<z.ZodBoolean>;
    emergencyAvailable: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    reportType: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        parameterId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodString;
        unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        referenceRange: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        inputType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dropdownOptions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        minValue: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        maxValue: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        ageGroup: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        gender: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        refMinMale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        refMaxMale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        refMinFemale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        refMaxFemale: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        refMinChild: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        refMaxChild: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
        rowType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        gender?: string | null | undefined;
        parameterId?: string | null | undefined;
        unit?: string | null | undefined;
        referenceRange?: string | null | undefined;
        inputType?: string | null | undefined;
        dropdownOptions?: string | null | undefined;
        minValue?: string | number | null | undefined;
        maxValue?: string | number | null | undefined;
        ageGroup?: string | null | undefined;
        refMinMale?: string | number | null | undefined;
        refMaxMale?: string | number | null | undefined;
        refMinFemale?: string | number | null | undefined;
        refMaxFemale?: string | number | null | undefined;
        refMinChild?: string | number | null | undefined;
        refMaxChild?: string | number | null | undefined;
        rowType?: string | null | undefined;
    }, {
        name: string;
        gender?: string | null | undefined;
        parameterId?: string | null | undefined;
        unit?: string | null | undefined;
        referenceRange?: string | null | undefined;
        inputType?: string | null | undefined;
        dropdownOptions?: string | null | undefined;
        minValue?: string | number | null | undefined;
        maxValue?: string | number | null | undefined;
        ageGroup?: string | null | undefined;
        refMinMale?: string | number | null | undefined;
        refMaxMale?: string | number | null | undefined;
        refMinFemale?: string | number | null | undefined;
        refMaxFemale?: string | number | null | undefined;
        refMinChild?: string | number | null | undefined;
        refMaxChild?: string | number | null | undefined;
        rowType?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    name: string;
    categoryId: string;
    serviceCode: string;
    price: number;
    gstPercentage: number;
    durationMinutes: number;
    homeCollectionAvailable: boolean;
    emergencyAvailable: boolean;
    reportType: string;
    sampleRequired?: string | null | undefined;
    normalRange?: string | null | undefined;
    machineRequired?: string | null | undefined;
    parameters?: {
        name: string;
        gender?: string | null | undefined;
        parameterId?: string | null | undefined;
        unit?: string | null | undefined;
        referenceRange?: string | null | undefined;
        inputType?: string | null | undefined;
        dropdownOptions?: string | null | undefined;
        minValue?: string | number | null | undefined;
        maxValue?: string | number | null | undefined;
        ageGroup?: string | null | undefined;
        refMinMale?: string | number | null | undefined;
        refMaxMale?: string | number | null | undefined;
        refMinFemale?: string | number | null | undefined;
        refMaxFemale?: string | number | null | undefined;
        refMinChild?: string | number | null | undefined;
        refMaxChild?: string | number | null | undefined;
        rowType?: string | null | undefined;
    }[] | undefined;
}, {
    name: string;
    categoryId: string;
    serviceCode: string;
    price: number;
    isActive?: boolean | undefined;
    gstPercentage?: number | undefined;
    durationMinutes?: number | undefined;
    sampleRequired?: string | null | undefined;
    normalRange?: string | null | undefined;
    machineRequired?: string | null | undefined;
    homeCollectionAvailable?: boolean | undefined;
    emergencyAvailable?: boolean | undefined;
    reportType?: string | undefined;
    parameters?: {
        name: string;
        gender?: string | null | undefined;
        parameterId?: string | null | undefined;
        unit?: string | null | undefined;
        referenceRange?: string | null | undefined;
        inputType?: string | null | undefined;
        dropdownOptions?: string | null | undefined;
        minValue?: string | number | null | undefined;
        maxValue?: string | number | null | undefined;
        ageGroup?: string | null | undefined;
        refMinMale?: string | number | null | undefined;
        refMaxMale?: string | number | null | undefined;
        refMinFemale?: string | number | null | undefined;
        refMaxFemale?: string | number | null | undefined;
        refMinChild?: string | number | null | undefined;
        refMaxChild?: string | number | null | undefined;
        rowType?: string | null | undefined;
    }[] | undefined;
}>;
export declare const packageSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    discount: z.ZodDefault<z.ZodNumber>;
    validityDays: z.ZodDefault<z.ZodNumber>;
    services: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    discount: number;
    name: string;
    price: number;
    validityDays: number;
    services: string[];
}, {
    name: string;
    price: number;
    services: string[];
    discount?: number | undefined;
    validityDays?: number | undefined;
}>;
export declare const orderSchema: z.ZodObject<{
    patientId: z.ZodString;
    doctorId: z.ZodString;
    referralId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodDefault<z.ZodEnum<["Routine", "Urgent", "Emergency"]>>;
    clinicalNotes: z.ZodOptional<z.ZodString>;
    diagnosis: z.ZodOptional<z.ZodString>;
    services: z.ZodArray<z.ZodString, "many">;
    packages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    doctorId: string;
    services: string[];
    priority: "Emergency" | "Routine" | "Urgent";
    clinicalNotes?: string | undefined;
    referralId?: string | null | undefined;
    diagnosis?: string | undefined;
    packages?: string[] | undefined;
}, {
    patientId: string;
    doctorId: string;
    services: string[];
    clinicalNotes?: string | undefined;
    referralId?: string | null | undefined;
    priority?: "Emergency" | "Routine" | "Urgent" | undefined;
    diagnosis?: string | undefined;
    packages?: string[] | undefined;
}>;
export declare const sampleCollectionSchema: z.ZodObject<{
    itemId: z.ZodString;
    containerType: z.ZodString;
    barcode: z.ZodString;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    containerType: string;
    barcode: string;
    remarks?: string | undefined;
}, {
    itemId: string;
    containerType: string;
    barcode: string;
    remarks?: string | undefined;
}>;
export declare const labResultSchema: z.ZodObject<{
    itemId: z.ZodString;
    actualResult: z.ZodString;
    referenceRange: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["Normal", "Low", "High", "Critical"]>>;
    machineReading: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
    machineId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "Normal" | "Low" | "High" | "Critical";
    itemId: string;
    actualResult: string;
    referenceRange?: string | undefined;
    remarks?: string | undefined;
    machineReading?: string | undefined;
    machineId?: string | null | undefined;
}, {
    itemId: string;
    actualResult: string;
    status?: "Normal" | "Low" | "High" | "Critical" | undefined;
    referenceRange?: string | undefined;
    remarks?: string | undefined;
    machineReading?: string | undefined;
    machineId?: string | null | undefined;
}>;
export declare const radiologyReportSchema: z.ZodObject<{
    itemId: z.ZodString;
    imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    findings: z.ZodString;
    impression: z.ZodString;
    conclusion: z.ZodOptional<z.ZodString>;
    radiographerId: z.ZodOptional<z.ZodString>;
    radiologistId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    findings: string;
    impression: string;
    imageUrls?: string[] | undefined;
    conclusion?: string | undefined;
    radiographerId?: string | undefined;
    radiologistId?: string | undefined;
}, {
    itemId: string;
    findings: string;
    impression: string;
    imageUrls?: string[] | undefined;
    conclusion?: string | undefined;
    radiographerId?: string | undefined;
    radiologistId?: string | undefined;
}>;
export declare const ultrasoundReportSchema: z.ZodObject<{
    itemId: z.ZodString;
    clinicalHistory: z.ZodOptional<z.ZodString>;
    findings: z.ZodString;
    impression: z.ZodString;
    recommendations: z.ZodOptional<z.ZodString>;
    sonologistId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    findings: string;
    impression: string;
    clinicalHistory?: string | undefined;
    recommendations?: string | undefined;
    sonologistId?: string | undefined;
}, {
    itemId: string;
    findings: string;
    impression: string;
    clinicalHistory?: string | undefined;
    recommendations?: string | undefined;
    sonologistId?: string | undefined;
}>;
export declare const ecgReportSchema: z.ZodObject<{
    itemId: z.ZodString;
    graphUrl: z.ZodOptional<z.ZodString>;
    findings: z.ZodString;
    interpretation: z.ZodString;
    recommendation: z.ZodOptional<z.ZodString>;
    operatorId: z.ZodOptional<z.ZodString>;
    doctorId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    findings: string;
    interpretation: string;
    doctorId?: string | undefined;
    graphUrl?: string | undefined;
    recommendation?: string | undefined;
    operatorId?: string | undefined;
}, {
    itemId: string;
    findings: string;
    interpretation: string;
    doctorId?: string | undefined;
    graphUrl?: string | undefined;
    recommendation?: string | undefined;
    operatorId?: string | undefined;
}>;
export declare const reportVerificationSchema: z.ZodObject<{
    itemId: z.ZodString;
    status: z.ZodEnum<["Approved", "Rejected", "PendingRetest", "Correction"]>;
    notes: z.ZodOptional<z.ZodString>;
    digitalSignatureUsed: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "Approved" | "Correction" | "Rejected" | "PendingRetest";
    itemId: string;
    notes?: string | undefined;
    digitalSignatureUsed?: string | undefined;
}, {
    status: "Approved" | "Correction" | "Rejected" | "PendingRetest";
    itemId: string;
    notes?: string | undefined;
    digitalSignatureUsed?: string | undefined;
}>;
export declare const machineSchema: z.ZodObject<{
    name: z.ZodString;
    manufacturer: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodString;
    calibrationDate: z.ZodOptional<z.ZodString>;
    maintenanceDate: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: string;
    name: string;
    serialNumber: string;
    manufacturer?: string | undefined;
    department?: string | undefined;
    model?: string | undefined;
    calibrationDate?: string | undefined;
    maintenanceDate?: string | undefined;
}, {
    name: string;
    serialNumber: string;
    status?: string | undefined;
    manufacturer?: string | undefined;
    department?: string | undefined;
    model?: string | undefined;
    calibrationDate?: string | undefined;
    maintenanceDate?: string | undefined;
}>;
export declare const referralDoctorSchema: z.ZodObject<{
    name: z.ZodString;
    hospital: z.ZodOptional<z.ZodString>;
    commissionPercentage: z.ZodDefault<z.ZodNumber>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    commissionPercentage: number;
    email?: string | undefined;
    phone?: string | undefined;
    hospital?: string | undefined;
}, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    hospital?: string | undefined;
    commissionPercentage?: number | undefined;
}>;
export declare const qcLogSchema: z.ZodObject<{
    machineId: z.ZodString;
    qcParameter: z.ZodString;
    expectedValue: z.ZodOptional<z.ZodString>;
    actualValue: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["Pass", "Fail"]>>;
}, "strip", z.ZodTypeAny, {
    status: "Pass" | "Fail";
    machineId: string;
    qcParameter: string;
    expectedValue?: string | undefined;
    actualValue?: string | undefined;
}, {
    machineId: string;
    qcParameter: string;
    status?: "Pass" | "Fail" | undefined;
    expectedValue?: string | undefined;
    actualValue?: string | undefined;
}>;
//# sourceMappingURL=diagnostics.schema.d.ts.map