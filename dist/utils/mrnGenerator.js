"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMRN = void 0;
const database_1 = require("../config/database");
/**
 * Generate a Medical Record Number in the format MRN-YYYY-XXXXX
 * Compatible with Hostinger MySQL / MariaDB (column `mrn`)
 */
const generateMRN = async () => {
    const year = new Date().getFullYear();
    const prefix = `MRN-${year}-`;
    let nextSeq = 1;
    try {
        const result = await (0, database_1.query)(`SELECT mrn FROM patients WHERE mrn LIKE $1 ORDER BY created_at DESC LIMIT 1`, [`${prefix}%`]);
        if (result.rows.length > 0 && result.rows[0].mrn) {
            const lastMrn = result.rows[0].mrn;
            const parts = lastMrn.split('-');
            if (parts.length === 3) {
                const lastNum = parseInt(parts[2], 10);
                if (!isNaN(lastNum)) {
                    nextSeq = lastNum + 1;
                }
            }
        }
    }
    catch (err) {
        console.warn('Warning fetching max MRN sequence:', err);
    }
    let paddedNumber = String(nextSeq).padStart(5, '0');
    let finalMrn = `${prefix}${paddedNumber}`;
    try {
        let exists = await (0, database_1.query)(`SELECT patient_id FROM patients WHERE mrn = $1`, [finalMrn]);
        let attempts = 0;
        while (exists.rows.length > 0 && attempts < 100) {
            nextSeq++;
            attempts++;
            paddedNumber = String(nextSeq).padStart(5, '0');
            finalMrn = `${prefix}${paddedNumber}`;
            exists = await (0, database_1.query)(`SELECT patient_id FROM patients WHERE mrn = $1`, [finalMrn]);
        }
    }
    catch (err) {
        console.warn('Warning checking MRN collision:', err);
    }
    return finalMrn;
};
exports.generateMRN = generateMRN;
//# sourceMappingURL=mrnGenerator.js.map