export declare const admitEmergencyPatient: (input: any) => Promise<{
    emergencyRecord: any;
    policeNotice: {
        requiresImmediatePoliceNotice: boolean;
        noticeSubject: string;
        templateData: {
            timeOfArrival: string;
            broughtBy: any;
            provisionalDiagnosis: string;
        };
    } | {
        requiresImmediatePoliceNotice: boolean;
        noticeSubject?: undefined;
        templateData?: undefined;
    };
}>;
export declare const checkAndTriggerPoliceIntimation: (emergencyRecord: any) => {
    requiresImmediatePoliceNotice: boolean;
    noticeSubject: string;
    templateData: {
        timeOfArrival: string;
        broughtBy: any;
        provisionalDiagnosis: string;
    };
} | {
    requiresImmediatePoliceNotice: boolean;
    noticeSubject?: undefined;
    templateData?: undefined;
};
export declare const generatePoliceIntimation: (emergencyId: string, officerDetails: any) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const getEmergencyConsents: (emergencyId: string) => Promise<any[]>;
export declare const saveDigitalConsent: (input: any) => Promise<any>;
export declare const logEmergencyVitals: (input: any) => Promise<any>;
export declare const getEmergencyVitalsHistory: (emergencyId: string) => Promise<any[]>;
export declare const updateEmergencyStatus: (input: any) => Promise<any>;
export declare const createEmergencyOrder: (input: any, userId: string) => Promise<any>;
export declare const getEmergencyOrders: (emergencyId: string) => Promise<any[]>;
export declare const updateEmergencyOrderStatus: (orderId: string, status: string) => Promise<any>;
export declare const getActiveEmergencyPatients: () => Promise<any[]>;
//# sourceMappingURL=emergency.service.d.ts.map