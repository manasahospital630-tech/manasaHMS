import { CreatePrescriptionInput } from './pharmacy.schema';
export declare const createPrescription: (doctorId: string, input: CreatePrescriptionInput) => Promise<any>;
export declare const getPendingPrescriptions: () => Promise<any[]>;
export declare const getPrescriptionById: (id: string) => Promise<any>;
export declare const dispensePrescription: (id: string, dispensedBy: string) => Promise<any>;
//# sourceMappingURL=prescription.service.d.ts.map