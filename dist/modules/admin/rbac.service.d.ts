export interface PermissionMatrixItem {
    module_id: string;
    module_key: string;
    module_name: string;
    category: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_append: boolean;
    can_append_to: boolean;
    is_hidden: boolean;
    custom_permissions?: Record<string, boolean>;
}
export interface CreateRoleInput {
    role_name: string;
    description?: string;
    permissions: PermissionMatrixItem[];
}
export declare const getModulesMaster: () => Promise<any[]>;
export declare const getRoles: () => Promise<any[]>;
export declare const getRoleById: (roleId: string) => Promise<any>;
export declare const createRole: (input: CreateRoleInput) => Promise<any>;
export declare const updateRole: (roleId: string, input: Partial<CreateRoleInput>) => Promise<any>;
export declare const deleteRole: (roleId: string) => Promise<{
    success: boolean;
}>;
export declare const getUserPermissionMatrix: (userId: string) => Promise<Record<string, any>>;
//# sourceMappingURL=rbac.service.d.ts.map