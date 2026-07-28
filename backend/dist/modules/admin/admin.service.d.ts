import { CreateUserInput, UpdateUserInput } from './admin.schema';
export declare const getAllUsers: (options: {
    search?: string;
    limit?: number;
    offset?: number;
}) => Promise<{
    users: any[];
    total: number;
}>;
export declare const createUser: (input: CreateUserInput) => Promise<any>;
export declare const updateUser: (id: string, input: UpdateUserInput) => Promise<any>;
export declare const getAuditLog: (filters: {
    userId?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
}) => Promise<any[]>;
export declare const getStaffProfile: (userId: string) => Promise<{
    user: any;
    metrics: {
        todayOP: number;
        thisWeekOP: number;
        thisMonthOP: number;
        thisYearOP: number;
        totalOP: number;
        consultationFee: number;
        hospitalShare: number;
        doctorShare: number;
        totalRevenue: number;
    };
    appointments: {
        appointment_id: any;
        op_number: string;
        token_no: string;
        patient_id: any;
        patient_name: string;
        medical_record_number: any;
        appointment_date: any;
        time: string;
        status: any;
        hospital_fee: number;
        doctor_fee: number;
        total_revenue: number;
        symptoms_brief: any;
        notes: any;
        vitals: any;
    }[];
    opRecords: {
        appointment_id: any;
        op_number: string;
        token_no: string;
        patient_id: any;
        patient_name: string;
        medical_record_number: any;
        appointment_date: any;
        time: string;
        status: any;
        hospital_fee: number;
        doctor_fee: number;
        total_revenue: number;
        symptoms_brief: any;
        notes: any;
        vitals: any;
    }[];
    activityLog: {
        id: number;
        action: string;
        timestamp: string;
        details: string;
    }[];
}>;
export declare const getDoctorProfiles: () => Promise<{
    doctorId: any;
    doctorName: any;
    email: any;
    phone: any;
    isActive: any;
    department: any;
    consultationFee: number;
    totalConsultations: number;
    totalPatients: number;
    totalAmount: number;
}[]>;
export declare const upsertDoctorProfile: (input: {
    doctorId: string;
    department: string;
    consultationFee: number;
}) => Promise<any>;
export declare const getHospitalSettings: () => Promise<any>;
export declare const updateHospitalSettings: (input: {
    hospitalName: string;
    hospitalAddress: string;
    phoneNumber: string;
    website: string;
    email: string;
    gstin: string;
    licenseInfo: string;
    hospitalLogo?: string;
    theme?: string;
}) => Promise<any>;
export declare const getDashboardStats: () => Promise<{
    staff: {
        doctorsPresent: number;
        dutyDoctors: number;
        nursesAttended: number;
        totalNurses: number;
        otherStaff: number;
    };
    opBooked: {
        opBookedToday: number;
    };
    revenue: {
        totalAmountOverall: number;
        totalBillsCount: number;
        revenueToday: number;
        totalIpBillsCount: number;
    };
    beds: {
        totalBeds: number;
        availableBeds: number;
        occupiedBeds: number;
    };
    recentActivity: any[];
}>;
export declare const getConsolidatedHospitalRevenue: (options: {
    period?: string;
    selectedTimeframe?: string;
    startDate?: string;
    endDate?: string;
}) => Promise<{
    consolidatedSummary: {
        today: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
        yesterday: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
        this_week: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
        last_week: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
        this_month: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
        last_month: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
        this_year: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
    };
    selectedBreakdown: {
        timeframe: string;
        details: {
            totalRevenue: number;
            totalTransactions: number;
            totalCollected: number;
            billing: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
            opd: {
                revenue: number;
                count: number;
                completedCount: number;
            };
            pharmacy: {
                revenue: number;
                count: number;
                paidAmount: number;
                pendingAmount: number;
                paidCount: number;
                unpaidCount: number;
            };
        };
    };
    period: string;
    active: {
        grandTotalRevenue: number;
        grandTotalCollected: number;
        billing: {
            totalRevenue: number;
            paidAmount: number;
            pendingAmount: number;
            totalCount: number;
            paidCount: number;
            unpaidCount: number;
        };
        pharmacy: {
            totalRevenue: number;
            paidAmount: number;
            pendingAmount: number;
            totalCount: number;
            paidCount: number;
            unpaidCount: number;
        };
        opConsultations: {
            totalRevenue: number;
            totalCheckins: number;
            completedCheckins: number;
        };
    };
    summaryCards: {
        today: {
            grandTotalRevenue: number;
            grandTotalCollected: number;
            totalTransactions: number;
        };
        yesterday: {
            grandTotalRevenue: number;
            grandTotalCollected: number;
            totalTransactions: number;
        };
        thisWeek: {
            grandTotalRevenue: number;
            grandTotalCollected: number;
            totalTransactions: number;
        };
        lastWeek: {
            grandTotalRevenue: number;
            grandTotalCollected: number;
            totalTransactions: number;
        };
        thisMonth: {
            grandTotalRevenue: number;
            grandTotalCollected: number;
            totalTransactions: number;
        };
        lastMonth: {
            grandTotalRevenue: number;
            grandTotalCollected: number;
            totalTransactions: number;
        };
        thisYear: {
            grandTotalRevenue: number;
            grandTotalCollected: number;
            totalTransactions: number;
        };
    };
}>;
export declare const deleteUser: (userId: string) => Promise<{
    success: boolean;
    message: string;
}>;
//# sourceMappingURL=admin.service.d.ts.map