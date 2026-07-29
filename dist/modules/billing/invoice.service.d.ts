import { CreateInvoiceInput, RecordPaymentInput } from './billing.schema';
export declare const createInvoice: (input: CreateInvoiceInput) => Promise<any>;
export declare const getInvoiceById: (id: string) => Promise<any>;
export declare const getAllInvoices: (filters: {
    status?: string;
    limit?: number;
    offset?: number;
}) => Promise<{
    invoices: any[];
    total: number;
}>;
export declare const getPatientInvoices: (patientId: string) => Promise<any[]>;
export declare const recordPayment: (id: string, input: RecordPaymentInput) => Promise<any>;
export declare const cancelInvoice: (id: string) => Promise<any>;
export declare const returnInvoice: (id: string) => Promise<any>;
export declare const updateInvoiceStatus: (id: string, status: "Paid" | "Unpaid" | "PartiallyPaid", paymentMethod: string) => Promise<any>;
export declare const getBillingAnalytics: (options: {
    period?: string;
    startDate?: string;
    endDate?: string;
}) => Promise<{
    period: string;
    totalInvoices: number;
    totalRevenue: number;
    totalAmountPaid: number;
    totalPendingAmount: number;
    paidInvoicesCount: number;
    unpaidInvoicesCount: number;
    partialInvoicesCount: number;
    cancelledInvoicesCount: number;
    cashCount: number;
    cashAmount: number;
    upiCount: number;
    upiAmount: number;
    cardCount: number;
    cardAmount: number;
    bankCount: number;
    bankAmount: number;
    insuranceCount: number;
    insuranceAmount: number;
    ipInvoicesCount: number;
    ipAmount: number;
    opInvoicesCount: number;
    opAmount: number;
    dailyTrends: {
        date: any;
        invoiceCount: number;
        totalAmount: number;
        amountPaid: number;
        cashAmount: number;
        upiAmount: number;
        cardAmount: number;
        ipAmount: number;
    }[];
}>;
//# sourceMappingURL=invoice.service.d.ts.map