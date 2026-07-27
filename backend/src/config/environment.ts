import dotenv from 'dotenv';

dotenv.config();

let rawPort: any = process.env.PORT || 5000;
if (typeof rawPort === 'string' && !isNaN(parseInt(rawPort, 10)) && !rawPort.includes('/') && !rawPort.includes('\\')) {
  rawPort = parseInt(rawPort, 10);
}

export const env = {
  PORT: rawPort,
  DB_HOST: process.env.DB_HOST || '193.203.184.228',
  DB_USER: process.env.DB_USER || 'u851000947_manasaadmin',
  DB_PASSWORD: process.env.DB_PASSWORD || 'ManasaHospital@123',
  DB_NAME: process.env.DB_NAME || 'u851000947_manasahms',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-for-manasa-hms-production-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'production',
};
