export declare const ensureTablesExist: () => Promise<void>;
export declare const getTeams: () => Promise<{
    teamId: any;
    teamName: any;
    category: any;
    teamType: any;
    teamLeadId: any;
    teamLeadName: any;
    teamLeadEmail: any;
    teamLeadRole: any;
    status: any;
    description: any;
    createdAt: any;
    memberCount: number;
    roles: any;
}[]>;
export declare const createTeam: (data: {
    teamId?: string;
    teamName: string;
    category?: string;
    teamType?: string;
    teamLeadId?: string;
    status?: string;
    description?: string;
    roles?: string[];
}) => Promise<any>;
export declare const updateTeam: (teamId: string, data: {
    teamName?: string;
    category?: string;
    teamType?: string;
    teamLeadId?: string;
    status?: string;
    description?: string;
    roles?: string[];
}) => Promise<any>;
export declare const deleteTeam: (teamId: string) => Promise<{
    success: boolean;
}>;
export declare const getTeamMembers: (teamId: string) => Promise<{
    assignedMembers: any[];
    availableUsers: any[];
    securityRoles: any[];
}>;
export declare const updateTeamMembers: (teamId: string, memberUserIds: string[]) => Promise<{
    success: boolean;
    count: number;
}>;
export declare const updateTeamRoles: (teamId: string, roles: string[]) => Promise<{
    success: boolean;
    roles: string[];
}>;
export declare const getBusinessUnits: () => Promise<{
    teamId: any;
    teamName: any;
    category: any;
    teamType: any;
    teamLeadId: any;
    teamLeadName: any;
    teamLeadEmail: any;
    teamLeadRole: any;
    status: any;
    description: any;
    createdAt: any;
    memberCount: number;
    roles: any;
}[]>;
export declare const createBusinessUnit: (data: {
    teamId?: string;
    teamName: string;
    category?: string;
    teamType?: string;
    teamLeadId?: string;
    status?: string;
    description?: string;
    roles?: string[];
}) => Promise<any>;
export declare const updateBusinessUnit: (teamId: string, data: {
    teamName?: string;
    category?: string;
    teamType?: string;
    teamLeadId?: string;
    status?: string;
    description?: string;
    roles?: string[];
}) => Promise<any>;
//# sourceMappingURL=businessUnits.service.d.ts.map