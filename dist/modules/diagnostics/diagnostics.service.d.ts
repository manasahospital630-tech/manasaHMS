export declare const getDashboardStats: () => Promise<{
    todayOrders: number;
    pendingSamples: number;
    collectedSamples: number;
    runningTests: number;
    completedReports: number;
    pendingVerification: number;
    todayRevenue: number;
    emergencyCases: number;
    charts: {
        volume: any[];
        departments: any[];
    };
}>;
export declare const getCategories: () => Promise<any[]>;
export declare const getServices: () => Promise<any[]>;
export declare const addService: (input: any) => Promise<any>;
export declare const editService: (serviceId: string, input: any) => Promise<any>;
export declare const deleteService: (serviceId: string) => Promise<{
    success: boolean;
}>;
export declare const getPackages: () => Promise<any[]>;
export declare const addPackage: (input: any) => Promise<any>;
export declare const editPackage: (packageId: string, input: any) => Promise<{
    success: boolean;
}>;
export declare const deletePackage: (packageId: string) => Promise<{
    success: boolean;
}>;
export declare const getOrders: () => Promise<any[]>;
export declare const createOrder: (input: any) => Promise<any>;
export declare const payOrder: (orderId: string) => Promise<{
    success: boolean;
}>;
export declare const collectSample: (input: any, userId: string) => Promise<any>;
export declare const submitLabResult: (input: any, userId: string) => Promise<any>;
export declare const submitRadiologyReport: (input: any, userId: string) => Promise<any>;
export declare const submitUltrasoundReport: (input: any, userId: string) => Promise<any>;
export declare const submitEcgReport: (input: any, userId: string) => Promise<any>;
export declare const verifyReport: (input: any, userId: string) => Promise<any>;
export declare const getMachines: () => Promise<any[]>;
export declare const addMachine: (input: any) => Promise<any>;
export declare const getReferrals: () => Promise<any[]>;
export declare const addReferral: (input: any) => Promise<any>;
export declare const getQcLogs: () => Promise<any[]>;
export declare const addQcLog: (input: any, userId: string) => Promise<any>;
export declare const updateOrderItemStatus: (itemId: string, status: string) => Promise<{
    success: boolean;
}>;
export declare const getPublicReport: (itemId: string) => Promise<any>;
//# sourceMappingURL=diagnostics.service.d.ts.map