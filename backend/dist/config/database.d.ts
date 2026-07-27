import mysql from 'mysql2/promise';
declare const pool: mysql.Pool;
export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
    insertId?: number | string;
}
export interface DbClient {
    query: <T = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
    release: () => void;
}
/**
 * Universal SQL query wrapper for Hostinger MySQL (mysql2)
 * Automatically converts Postgres $1, $2, $3 positional params to ?
 * and handles RETURNING clause and Postgres function compatibility.
 */
export declare const query: <T = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
export declare const getClient: () => Promise<DbClient>;
export default pool;
//# sourceMappingURL=database.d.ts.map