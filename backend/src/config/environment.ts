import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const defaultDb = process.env.DATABASE_URL || 'postgresql://hms_user.ctrlsyhzszlufdnguerz:Nine248688944Pass%21@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const defaultJwt = 'super-secret-jwt-key-for-manasa-hms-production-2026';

let rawPort: any = process.env.PORT || 5000;
if (typeof rawPort === 'string' && !isNaN(parseInt(rawPort, 10)) && !rawPort.includes('/') && !rawPort.includes('\\')) {
  rawPort = parseInt(rawPort, 10);
}

export const env = {
  PORT: rawPort,
  DATABASE_URL: process.env.DATABASE_URL || defaultDb,
  JWT_SECRET: process.env.JWT_SECRET || defaultJwt,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'production',
};
