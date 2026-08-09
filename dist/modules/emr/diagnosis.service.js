"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncounterDiagnoses = exports.addDiagnosis = void 0;
const database_1 = require("../../config/database");
const addDiagnosis = async (encounterId, input) => {
    const result = await (0, database_1.query)(`INSERT INTO diagnoses (encounter_id, icd_code, description, is_primary)
     VALUES ($1, $2, $3, $4) RETURNING *`, [encounterId, input.icdCode, input.description, input.isPrimary || false]);
    return result.rows[0];
};
exports.addDiagnosis = addDiagnosis;
const getEncounterDiagnoses = async (encounterId) => {
    const result = await (0, database_1.query)('SELECT * FROM diagnoses WHERE encounter_id = $1 ORDER BY is_primary DESC, recorded_at ASC', [encounterId]);
    return result.rows;
};
exports.getEncounterDiagnoses = getEncounterDiagnoses;
//# sourceMappingURL=diagnosis.service.js.map