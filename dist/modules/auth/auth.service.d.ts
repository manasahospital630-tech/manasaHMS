import { RegisterInput, LoginInput } from './auth.schema';
export declare const registerUser: (input: RegisterInput) => Promise<any>;
export declare const loginUser: (input: LoginInput) => Promise<{
    token: string;
    user: {
        user_id: any;
        email: any;
        first_name: any;
        last_name: any;
        role: any;
        permissions: Record<string, any>;
    };
}>;
export declare const getUserProfile: (userId: string) => Promise<any>;
//# sourceMappingURL=auth.service.d.ts.map