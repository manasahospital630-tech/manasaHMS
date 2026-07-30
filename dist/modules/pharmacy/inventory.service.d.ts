import { CreateInventoryItemInput, UpdateInventoryItemInput, CreateSaleInput } from './pharmacy.schema';
export declare const getInventory: (options: {
    search?: string;
    lowStock?: boolean;
    limit?: number;
    offset?: number;
}) => Promise<{
    items: any[];
    total: number;
}>;
export declare const getInventoryItemById: (id: string) => Promise<any>;
export declare const createInventoryItem: (input: CreateInventoryItemInput) => Promise<any>;
export declare const bulkCreateInventoryItems: (items: any[]) => Promise<{
    importedCount: number;
    items: any[];
}>;
export declare const updateInventoryItem: (id: string, input: UpdateInventoryItemInput) => Promise<any>;
export declare const getLowStockItems: () => Promise<any[]>;
export declare const createSale: (pharmacistId: string, input: CreateSaleInput) => Promise<any>;
export declare const getSalesHistory: () => Promise<{
    sales: any[];
    stats: {
        day: {
            count: number;
            amount: number;
            byMethod: {
                UPI: {
                    count: number;
                    amount: number;
                };
                Card: {
                    count: number;
                    amount: number;
                };
                Cash: {
                    count: number;
                    amount: number;
                };
                Insurance: {
                    count: number;
                    amount: number;
                };
                'Bank Transfer': {
                    count: number;
                    amount: number;
                };
            };
        };
        week: {
            count: number;
            amount: number;
            byMethod: {
                UPI: {
                    count: number;
                    amount: number;
                };
                Card: {
                    count: number;
                    amount: number;
                };
                Cash: {
                    count: number;
                    amount: number;
                };
                Insurance: {
                    count: number;
                    amount: number;
                };
                'Bank Transfer': {
                    count: number;
                    amount: number;
                };
            };
        };
        month: {
            count: number;
            amount: number;
            byMethod: {
                UPI: {
                    count: number;
                    amount: number;
                };
                Card: {
                    count: number;
                    amount: number;
                };
                Cash: {
                    count: number;
                    amount: number;
                };
                Insurance: {
                    count: number;
                    amount: number;
                };
                'Bank Transfer': {
                    count: number;
                    amount: number;
                };
            };
        };
    };
}>;
//# sourceMappingURL=inventory.service.d.ts.map