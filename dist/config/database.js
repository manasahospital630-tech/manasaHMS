"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const environment_1 = require("./environment");
const pool = promise_1.default.createPool({
    host: environment_1.env.DB_HOST,
    user: environment_1.env.DB_USER,
    password: environment_1.env.DB_PASSWORD,
    database: environment_1.env.DB_NAME,
    port: environment_1.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    dateStrings: true
});
/**
 * Universal SQL query wrapper for Hostinger MySQL (mysql2)
 * Automatically converts Postgres $1, $2, $3 positional params to ?
 * and handles RETURNING clause and Postgres function compatibility.
 */
const query = async (text, params) => {
    let mysqlSql = text.replace(/\$(\d+)/g, '?');
    mysqlSql = mysqlSql.replace(/uuid_generate_v4\(\)/gi, 'UUID()');
    mysqlSql = mysqlSql.replace(/INTERVAL\s+'(\d+)\s+([a-zA-Z]+)s?'/gi, (_match, num, unit) => {
        return `INTERVAL ${num} ${unit.toUpperCase()}`;
    });
    const returningMatch = mysqlSql.match(/\s+RETURNING\s+([^\s;,]+(?:\s*,\s*[^\s;,]+)*)/i);
    if (returningMatch) {
        mysqlSql = mysqlSql.replace(/\s+RETURNING\s+[^\s;,]+/gi, '');
    }
    const [result] = await pool.query(mysqlSql, params || []);
    if (Array.isArray(result)) {
        const rows = result;
        return {
            rows,
            rowCount: rows.length,
        };
    }
    else {
        const header = result;
        let rows = [];
        if (returningMatch && params && params.length > 0) {
            try {
                const tableMatch = mysqlSql.match(/(?:INSERT\s+INTO|UPDATE)\s+([`\w]+)/i);
                if (tableMatch) {
                    const tableName = tableMatch[1].replace(/`/g, '');
                    const primaryId = params.find(p => typeof p === 'string' && p.length > 10) || params[params.length - 1] || header.insertId;
                    if (primaryId) {
                        const pkColName = tableName.endsWith('s') ? `${tableName.slice(0, -1)}_id` : `${tableName}_id`;
                        try {
                            const [fetched] = await pool.query(`SELECT * FROM \`${tableName}\` WHERE \`${pkColName}\` = ? OR \`user_id\` = ? OR \`patient_id\` = ? OR \`appointment_id\` = ? OR \`encounter_id\` = ? OR \`invoice_id\` = ? OR \`test_id\` = ? OR \`case_id\` = ? LIMIT 1`, [primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId]);
                            if (Array.isArray(fetched) && fetched.length > 0) {
                                rows = fetched;
                            }
                        }
                        catch {
                            // Fallback
                        }
                    }
                }
            }
            catch {
                // Fallback
            }
        }
        return {
            rows,
            rowCount: header.affectedRows || 0,
            insertId: header.insertId,
        };
    }
};
exports.query = query;
const getClient = async () => {
    const conn = await pool.getConnection();
    return {
        query: async (text, params) => {
            let mysqlSql = text.replace(/\$(\d+)/g, '?');
            mysqlSql = mysqlSql.replace(/uuid_generate_v4\(\)/gi, 'UUID()');
            const trimmedUpper = mysqlSql.trim().toUpperCase();
            if (trimmedUpper === 'BEGIN') {
                await conn.beginTransaction();
                return { rows: [], rowCount: 0 };
            }
            if (trimmedUpper === 'COMMIT') {
                await conn.commit();
                return { rows: [], rowCount: 0 };
            }
            if (trimmedUpper === 'ROLLBACK') {
                await conn.rollback();
                return { rows: [], rowCount: 0 };
            }
            const returningMatch = mysqlSql.match(/\s+RETURNING\s+([^\s;,]+(?:\s*,\s*[^\s;,]+)*)/i);
            if (returningMatch) {
                mysqlSql = mysqlSql.replace(/\s+RETURNING\s+[^\s;,]+/gi, '');
            }
            const [result] = await conn.query(mysqlSql, params || []);
            if (Array.isArray(result)) {
                const rows = result;
                return { rows, rowCount: rows.length };
            }
            else {
                const header = result;
                let rows = [];
                if (returningMatch && params && params.length > 0) {
                    try {
                        const tableMatch = mysqlSql.match(/(?:INSERT\s+INTO|UPDATE)\s+([`\w]+)/i);
                        if (tableMatch) {
                            const tableName = tableMatch[1].replace(/`/g, '');
                            const primaryId = params.find(p => typeof p === 'string' && p.length > 10) || params[params.length - 1] || header.insertId;
                            if (primaryId) {
                                const pkColName = tableName.endsWith('s') ? `${tableName.slice(0, -1)}_id` : `${tableName}_id`;
                                try {
                                    const [fetched] = await conn.query(`SELECT * FROM \`${tableName}\` WHERE \`${pkColName}\` = ? OR \`user_id\` = ? OR \`patient_id\` = ? OR \`appointment_id\` = ? OR \`encounter_id\` = ? OR \`invoice_id\` = ? OR \`test_id\` = ? OR \`case_id\` = ? LIMIT 1`, [primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId]);
                                    if (Array.isArray(fetched) && fetched.length > 0) {
                                        rows = fetched;
                                    }
                                }
                                catch {
                                    // Fallback
                                }
                            }
                        }
                    }
                    catch {
                        // Fallback
                    }
                }
                return { rows, rowCount: header.affectedRows || 0, insertId: header.insertId };
            }
        },
        release: () => {
            conn.release();
        }
    };
};
exports.getClient = getClient;
exports.default = pool;
//# sourceMappingURL=database.js.map