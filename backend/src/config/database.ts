import mysql, { ResultSetHeader } from 'mysql2/promise';
import { env } from './environment';

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true
});

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
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  let mysqlSql = text.replace(/\$(\d+)/g, '?');
  mysqlSql = mysqlSql.replace(/uuid_generate_v4\(\)/gi, 'UUID()');

  const returningMatch = mysqlSql.match(/\s+RETURNING\s+([^\s;,]+(?:\s*,\s*[^\s;,]+)*)/i);
  if (returningMatch) {
    mysqlSql = mysqlSql.replace(/\s+RETURNING\s+[^\s;,]+/gi, '');
  }

  const [result] = await pool.query<any>(mysqlSql, params || []);

  if (Array.isArray(result)) {
    const rows = result as T[];
    return {
      rows,
      rowCount: rows.length,
    };
  } else {
    const header = result as ResultSetHeader;
    let rows: T[] = [];

    if (returningMatch && params && params.length > 0) {
      try {
        const tableMatch = mysqlSql.match(/(?:INSERT\s+INTO|UPDATE)\s+([`\w]+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].replace(/`/g, '');
          const primaryId = params.find(p => typeof p === 'string' && p.length > 10) || params[params.length - 1] || header.insertId;
          if (primaryId) {
            const pkColName = tableName.endsWith('s') ? `${tableName.slice(0, -1)}_id` : `${tableName}_id`;
            try {
              const [fetched] = await pool.query<any>(
                `SELECT * FROM \`${tableName}\` WHERE \`${pkColName}\` = ? OR \`user_id\` = ? OR \`patient_id\` = ? OR \`appointment_id\` = ? OR \`encounter_id\` = ? OR \`invoice_id\` = ? OR \`test_id\` = ? OR \`case_id\` = ? LIMIT 1`,
                [primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId]
              );
              if (Array.isArray(fetched) && fetched.length > 0) {
                rows = fetched as T[];
              }
            } catch {
              // Fallback
            }
          }
        }
      } catch {
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

export const getClient = async (): Promise<DbClient> => {
  const conn = await pool.getConnection();

  return {
    query: async <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
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

      const [result] = await conn.query<any>(mysqlSql, params || []);

      if (Array.isArray(result)) {
        const rows = result as T[];
        return { rows, rowCount: rows.length };
      } else {
        const header = result as ResultSetHeader;
        let rows: T[] = [];

        if (returningMatch && params && params.length > 0) {
          try {
            const tableMatch = mysqlSql.match(/(?:INSERT\s+INTO|UPDATE)\s+([`\w]+)/i);
            if (tableMatch) {
              const tableName = tableMatch[1].replace(/`/g, '');
              const primaryId = params.find(p => typeof p === 'string' && p.length > 10) || params[params.length - 1] || header.insertId;
              if (primaryId) {
                const pkColName = tableName.endsWith('s') ? `${tableName.slice(0, -1)}_id` : `${tableName}_id`;
                try {
                  const [fetched] = await conn.query<any>(
                    `SELECT * FROM \`${tableName}\` WHERE \`${pkColName}\` = ? OR \`user_id\` = ? OR \`patient_id\` = ? OR \`appointment_id\` = ? OR \`encounter_id\` = ? OR \`invoice_id\` = ? OR \`test_id\` = ? OR \`case_id\` = ? LIMIT 1`,
                    [primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId, primaryId]
                  );
                  if (Array.isArray(fetched) && fetched.length > 0) {
                    rows = fetched as T[];
                  }
                } catch {
                  // Fallback
                }
              }
            }
          } catch {
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

export default pool;
