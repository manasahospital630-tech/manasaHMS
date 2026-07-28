import { CreateAppointmentInput } from './appointment.schema';
export declare const createAppointment: (input: CreateAppointmentInput) => Promise<any>;
export declare const getAppointments: (filters: {
    doctorId?: string;
    status?: string;
    date?: string;
    limit?: number;
    offset?: number;
}) => Promise<{
    appointments: any[];
    total: number;
}>;
export declare const getAppointmentById: (id: string) => Promise<any>;
export declare const updateAppointmentStatus: (id: string, status: string) => Promise<any>;
export declare const createOPCheckIn: (input: {
    patientId: string;
    doctorId: string;
    paymentMethod: string;
}) => Promise<{
    appointment: any;
    invoice: {
        invoice_id: string;
        invoice_number: string;
        total_amount: number;
        payment_mode: string;
    };
    isFreeReview: boolean;
    chargedFee: number;
    doctorName: string;
    department: any;
    opNo: number;
    tokenNo: number;
    billNo: string;
}>;
export declare const checkReviewStatus: (patientId: string, doctorId: string) => Promise<{
    isFreeReview: boolean;
    lastAppointmentDate: any;
}>;
export declare const recordTriageVitals: (input: {
    appointmentId?: string;
    bookingId?: string;
    patientId: string;
    weight?: number | string;
    temperature?: number | string;
    heartRate?: number | string;
    oxygenSaturation?: number | string;
    bloodPressureSystolic?: number | string;
    bloodPressureDiastolic?: number | string;
    glucoseLevel?: number | string;
    glucoseType?: string;
    notes?: string;
    doctorNotes?: string;
    clinicalNotes?: string;
    tests?: string[];
}) => Promise<{
    appointment: any;
    vitalRecord: {
        recordedAt: string;
        opBookingId: string;
        weight: number;
        temperature: number;
        heartRate: number;
        oxygenSaturation: number;
        bloodPressure: {
            systolic: number;
            diastolic: number;
        };
        glucoseLevel: number;
        glucoseType: string;
        notes: string;
        doctorNotes: string;
        tests: string[];
    };
}>;
//# sourceMappingURL=appointment.service.d.ts.map