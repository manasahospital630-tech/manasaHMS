"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '../.env') });
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const setupSettingsTable = async () => {
    try {
        console.log('Connecting to database...');
        // Create hospital_settings table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS hospital_settings (
        id INT PRIMARY KEY DEFAULT 1,
        hospital_name VARCHAR(255) NOT NULL,
        hospital_address TEXT,
        phone_number VARCHAR(100),
        website VARCHAR(255),
        email VARCHAR(255),
        gstin VARCHAR(100),
        license_info TEXT,
        hospital_logo TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT one_row_only CHECK (id = 1)
      );
    `);
        console.log('Table hospital_settings verified/created.');
        // Seed default settings row if empty
        const checkRes = await pool.query('SELECT COUNT(*) FROM hospital_settings');
        if (parseInt(checkRes.rows[0].count, 10) === 0) {
            await pool.query(`
        INSERT INTO hospital_settings (id, hospital_name, hospital_address, phone_number, website, email, gstin, license_info, hospital_logo)
        VALUES (
          1, 
          'Prasad Hospitals India Pvt. Ltd.', 
          '44-617/12, Adjacent to BSNL Telephone Exchange, Mallapur Road, Nacharam, Secunderabad-500 076',
          '040 - 68244555, 88012 33333',
          'https://prasadhospitals.in',
          'info@prasadhospitals.in',
          '36AABCU2450J1ZD',
          'Reg No: PR-2026/8508',
          ''
        )
      `);
            console.log('Default hospital settings seeded.');
        }
        else {
            console.log('Hospital settings row already exists.');
        }
    }
    catch (err) {
        console.error('Error setting up settings table:', err);
    }
    finally {
        await pool.end();
        console.log('Disconnected.');
    }
};
setupSettingsTable();
//# sourceMappingURL=scratch_create_settings.js.map