"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispensePrescription = exports.getPrescriptionById = exports.getPendingPrescriptions = exports.createPrescription = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const createPrescription = async (doctorId, input) => {
    const client = await (0, database_1.getClient)();
    try {
        await client.query('BEGIN');
        const rxResult = await client.query(`INSERT INTO prescriptions (encounter_id, doctor_id, patient_id) VALUES ($1,$2,$3) RETURNING *`, [input.encounterId, doctorId, input.patientId]);
        const prescription = rxResult.rows[0];
        for (const item of input.items) {
            await client.query(`INSERT INTO prescription_items (prescription_id, item_id, dosage_instruction, quantity_prescribed)
         VALUES ($1,$2,$3,$4)`, [prescription.prescription_id, item.itemId, item.dosageInstruction, item.quantityPrescribed]);
        }
        await client.query('COMMIT');
        return prescription;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createPrescription = createPrescription;
const getPendingPrescriptions = async () => {
    const result = await (0, database_1.query)(`SELECT pr.*, p.first_name || ' ' || p.last_name as patient_name, p.medical_record_number,
            u.first_name || ' ' || u.last_name as doctor_name
     FROM prescriptions pr
     JOIN patients p ON pr.patient_id = p.patient_id
     JOIN users u ON pr.doctor_id = u.user_id
     WHERE pr.status = 'Pending' ORDER BY pr.issued_at ASC`);
    for (const rx of result.rows) {
        const items = await (0, database_1.query)(`SELECT pi.*, ii.item_name, ii.stock_quantity FROM prescription_items pi
       JOIN inventory_items ii ON pi.item_id = ii.item_id WHERE pi.prescription_id = $1`, [rx.prescription_id]);
        rx.items = items.rows;
    }
    return result.rows;
};
exports.getPendingPrescriptions = getPendingPrescriptions;
const getPrescriptionById = async (id) => {
    const result = await (0, database_1.query)(`SELECT pr.*, p.first_name || ' ' || p.last_name as patient_name,
            u.first_name || ' ' || u.last_name as doctor_name
     FROM prescriptions pr JOIN patients p ON pr.patient_id = p.patient_id
     JOIN users u ON pr.doctor_id = u.user_id WHERE pr.prescription_id = $1`, [id]);
    if (result.rows.length === 0)
        throw new errorHandler_1.AppError('Prescription not found.', 404);
    const items = await (0, database_1.query)(`SELECT pi.*, ii.item_name, ii.unit_price FROM prescription_items pi
     JOIN inventory_items ii ON pi.item_id = ii.item_id WHERE pi.prescription_id = $1`, [id]);
    const prescription = result.rows[0];
    prescription.items = items.rows;
    return prescription;
};
exports.getPrescriptionById = getPrescriptionById;
const dispensePrescription = async (id, dispensedBy) => {
    const client = await (0, database_1.getClient)();
    try {
        await client.query('BEGIN');
        const rxResult = await client.query('SELECT * FROM prescriptions WHERE prescription_id = $1 AND status = $2', [id, 'Pending']);
        if (rxResult.rows.length === 0)
            throw new errorHandler_1.AppError('Prescription not found or already dispensed.', 404);
        const items = await client.query(`SELECT pi.*, ii.stock_quantity, ii.item_name FROM prescription_items pi
       JOIN inventory_items ii ON pi.item_id = ii.item_id WHERE pi.prescription_id = $1`, [id]);
        for (const item of items.rows) {
            if (item.stock_quantity < item.quantity_prescribed) {
                throw new errorHandler_1.AppError(`Insufficient stock for ${item.item_name}. Available: ${item.stock_quantity}, Required: ${item.quantity_prescribed}`, 400);
            }
            await client.query('UPDATE inventory_items SET stock_quantity = stock_quantity - $1 WHERE item_id = $2', [item.quantity_prescribed, item.item_id]);
        }
        const result = await client.query(`UPDATE prescriptions SET status = 'Dispensed', dispensed_by = $1, dispensed_at = NOW() WHERE prescription_id = $2 RETURNING *`, [dispensedBy, id]);
        await client.query('COMMIT');
        return result.rows[0];
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.dispensePrescription = dispensePrescription;
//# sourceMappingURL=prescription.service.js.map