export interface CreateDepartmentInput {
    departmentName: string;
    departmentCode?: string;
    description?: string;
}
export interface UpdateDepartmentInput {
    departmentName?: string;
    departmentCode?: string;
    description?: string;
    isActive?: boolean;
}
export declare const getAllDepartments: () => Promise<{
    departmentId: any;
    departmentName: any;
    departmentCode: any;
    description: any;
    isActive: boolean;
    memberCount: number;
    doctorCount: number;
    createdAt: any;
    updatedAt: any;
}[]>;
export declare const createDepartment: (input: CreateDepartmentInput) => Promise<any>;
export declare const updateDepartment: (id: string, input: UpdateDepartmentInput) => Promise<any>;
export declare const deleteDepartment: (id: string) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=department.service.d.ts.map