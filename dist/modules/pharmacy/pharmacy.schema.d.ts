import { z } from 'zod';
export declare const createInventoryItemSchema: z.ZodObject<{
    itemName: z.ZodString;
    sku: z.ZodString;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    manufacturer: z.ZodOptional<z.ZodString>;
    stockQuantity: z.ZodNumber;
    reorderLevel: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    unitPrice: z.ZodNumber;
    expiryDate: z.ZodEffects<z.ZodString, string, string>;
    genericName: z.ZodString;
    batchNo: z.ZodString;
    rackNo: z.ZodString;
    purchasePrice: z.ZodNumber;
    isSheet: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    tabletsPerSheet: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    hsnCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    itemName: string;
    sku: string;
    category: string;
    stockQuantity: number;
    reorderLevel: number;
    unitPrice: number;
    expiryDate: string;
    genericName: string;
    batchNo: string;
    rackNo: string;
    purchasePrice: number;
    isSheet: boolean;
    tabletsPerSheet: number;
    hsnCode: string;
    manufacturer?: string | undefined;
}, {
    itemName: string;
    sku: string;
    stockQuantity: number;
    unitPrice: number;
    expiryDate: string;
    genericName: string;
    batchNo: string;
    rackNo: string;
    purchasePrice: number;
    category?: string | undefined;
    manufacturer?: string | undefined;
    reorderLevel?: number | undefined;
    isSheet?: boolean | undefined;
    tabletsPerSheet?: number | undefined;
    hsnCode?: string | undefined;
}>;
export declare const updateInventoryItemSchema: z.ZodObject<{
    itemName: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    manufacturer: z.ZodOptional<z.ZodString>;
    stockQuantity: z.ZodOptional<z.ZodNumber>;
    reorderLevel: z.ZodOptional<z.ZodNumber>;
    unitPrice: z.ZodOptional<z.ZodNumber>;
    expiryDate: z.ZodOptional<z.ZodString>;
    genericName: z.ZodOptional<z.ZodString>;
    batchNo: z.ZodOptional<z.ZodString>;
    rackNo: z.ZodOptional<z.ZodString>;
    purchasePrice: z.ZodOptional<z.ZodNumber>;
    isSheet: z.ZodOptional<z.ZodBoolean>;
    tabletsPerSheet: z.ZodOptional<z.ZodNumber>;
    hsnCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    itemName?: string | undefined;
    category?: string | undefined;
    manufacturer?: string | undefined;
    stockQuantity?: number | undefined;
    reorderLevel?: number | undefined;
    unitPrice?: number | undefined;
    expiryDate?: string | undefined;
    genericName?: string | undefined;
    batchNo?: string | undefined;
    rackNo?: string | undefined;
    purchasePrice?: number | undefined;
    isSheet?: boolean | undefined;
    tabletsPerSheet?: number | undefined;
    hsnCode?: string | undefined;
}, {
    itemName?: string | undefined;
    category?: string | undefined;
    manufacturer?: string | undefined;
    stockQuantity?: number | undefined;
    reorderLevel?: number | undefined;
    unitPrice?: number | undefined;
    expiryDate?: string | undefined;
    genericName?: string | undefined;
    batchNo?: string | undefined;
    rackNo?: string | undefined;
    purchasePrice?: number | undefined;
    isSheet?: boolean | undefined;
    tabletsPerSheet?: number | undefined;
    hsnCode?: string | undefined;
}>;
export declare const createPrescriptionSchema: z.ZodObject<{
    encounterId: z.ZodString;
    patientId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        dosageInstruction: z.ZodString;
        quantityPrescribed: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        dosageInstruction: string;
        quantityPrescribed: number;
    }, {
        itemId: string;
        dosageInstruction: string;
        quantityPrescribed: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    encounterId: string;
    items: {
        itemId: string;
        dosageInstruction: string;
        quantityPrescribed: number;
    }[];
}, {
    patientId: string;
    encounterId: string;
    items: {
        itemId: string;
        dosageInstruction: string;
        quantityPrescribed: number;
    }[];
}>;
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export declare const createSaleSchema: z.ZodObject<{
    patientId: z.ZodString;
    paymentMethod: z.ZodEnum<["Cash", "Card", "Insurance", "Bank Transfer", "UPI", "IP Ledger"]>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        sellLoose: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        quantity: number;
        sellLoose: boolean;
        discount: number;
    }, {
        itemId: string;
        quantity: number;
        sellLoose?: boolean | undefined;
        discount?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    paymentMethod: "Cash" | "Card" | "Insurance" | "Bank Transfer" | "UPI" | "IP Ledger";
    items: {
        itemId: string;
        quantity: number;
        sellLoose: boolean;
        discount: number;
    }[];
}, {
    patientId: string;
    paymentMethod: "Cash" | "Card" | "Insurance" | "Bank Transfer" | "UPI" | "IP Ledger";
    items: {
        itemId: string;
        quantity: number;
        sellLoose?: boolean | undefined;
        discount?: number | undefined;
    }[];
}>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
//# sourceMappingURL=pharmacy.schema.d.ts.map