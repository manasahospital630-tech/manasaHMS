import { RoutineAdmissionInput, EmergencyFastTrackInput, TransferBedInput, BedInput } from './ip.schema';
export declare const getBeds: () => Promise<any[]>;
export declare const getActiveAdmissions: () => Promise<any[]>;
export declare const admitRoutine: (input: RoutineAdmissionInput) => Promise<any>;
export declare const admitEmergencyFastTrack: (input: EmergencyFastTrackInput) => Promise<{
    patient: any;
    admission: any;
    invoice_id: any;
}>;
export declare const transferBed: (input: TransferBedInput, userId: string) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const dischargePatient: (ipAdmissionId: string) => Promise<{
    success: boolean;
}>;
export declare const addBed: (input: BedInput) => Promise<any>;
export declare const editBed: (bedId: string, input: BedInput) => Promise<any>;
export declare const deleteBed: (bedId: string) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=ip.service.d.ts.map