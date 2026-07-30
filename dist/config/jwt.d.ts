export declare const JWT_SECRET: string;
export declare const JWT_EXPIRES_IN: string;
export interface TokenPayload {
    userId: string;
    role: string;
    email: string;
}
export declare const generateToken: (payload: TokenPayload) => string;
export declare const verifyToken: (token: string) => TokenPayload;
//# sourceMappingURL=jwt.d.ts.map