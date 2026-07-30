"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const mrnGenerator_1 = require("./mrnGenerator");
const SALT_ROUNDS = 12;
const seedUsers = [
    { email: 'admin@hannahhms.com', firstName: 'System', lastName: 'Admin', role: 'Admin' },
    { email: 'doctor@hannahhms.com', firstName: 'John', lastName: 'Doe', role: 'Doctor' },
    { email: 'aarav.mehta@hannahhms.com', firstName: 'Aarav', lastName: 'Mehta', role: 'Doctor' },
    { email: 'priya.nair@hannahhms.com', firstName: 'Priya', lastName: 'Nair', role: 'Doctor' },
    { email: 'nurse@hannahhms.com', firstName: 'Clara', lastName: 'Barton', role: 'Nurse' },
    { email: 'receptionist@hannahhms.com', firstName: 'Sarah', lastName: 'Receptionist', role: 'Receptionist' },
    { email: 'pharmacist@hannahhms.com', firstName: 'Phil', lastName: 'Pharmacist', role: 'Pharmacist' },
    { email: 'biller@hannahhms.com', firstName: 'Billy', lastName: 'Biller', role: 'Biller' },
    { email: 'patient@hannahhms.com', firstName: 'Jane', lastName: 'Patient', role: 'Patient' }
];
const seedMedicines = [
    // ── Tablets (sold as sheets) ──
    { itemName: 'Crocin 650mg', sku: 'MED-CRO-650', category: 'Tablet', manufacturer: 'GSK', stockQuantity: 400, reorderLevel: 50, unitPrice: 30.00, expiryDate: '2028-12-31', genericName: 'Paracetamol', batchNo: 'BAT-CRO-001', rackNo: 'RACK-A1', purchasePrice: 15.00, isSheet: true, tabletsPerSheet: 10 },
    { itemName: 'Combiflam', sku: 'MED-COM-100', category: 'Tablet', manufacturer: 'Sanofi', stockQuantity: 300, reorderLevel: 50, unitPrice: 45.00, expiryDate: '2027-10-31', genericName: 'Ibuprofen + Paracetamol', batchNo: 'BAT-COM-001', rackNo: 'RACK-A1', purchasePrice: 22.00, isSheet: true, tabletsPerSheet: 10 },
    { itemName: 'Pan-D', sku: 'MED-PAN-D01', category: 'Tablet', manufacturer: 'Alkem', stockQuantity: 200, reorderLevel: 30, unitPrice: 150.00, expiryDate: '2028-06-30', genericName: 'Pantoprazole + Domperidone', batchNo: 'BAT-PAN-001', rackNo: 'RACK-A2', purchasePrice: 75.00, isSheet: true, tabletsPerSheet: 15 },
    { itemName: 'Limcee 500mg', sku: 'MED-LIM-500', category: 'Tablet', manufacturer: 'Abbott', stockQuantity: 500, reorderLevel: 100, unitPrice: 25.00, expiryDate: '2029-01-31', genericName: 'Ascorbic Acid (Vitamin C)', batchNo: 'BAT-LIM-001', rackNo: 'RACK-A2', purchasePrice: 12.00, isSheet: true, tabletsPerSheet: 15 },
    { itemName: 'Azithral 500mg', sku: 'MED-AZI-500', category: 'Tablet', manufacturer: 'Alembic', stockQuantity: 150, reorderLevel: 20, unitPrice: 120.00, expiryDate: '2027-08-31', genericName: 'Azithromycin', batchNo: 'BAT-AZI-001', rackNo: 'RACK-A3', purchasePrice: 60.00, isSheet: true, tabletsPerSheet: 6 },
    { itemName: 'Glycomet 500mg', sku: 'MED-GLY-500', category: 'Tablet', manufacturer: 'USV', stockQuantity: 250, reorderLevel: 50, unitPrice: 60.00, expiryDate: '2028-11-30', genericName: 'Metformin HCl', batchNo: 'BAT-GLY-001', rackNo: 'RACK-A3', purchasePrice: 30.00, isSheet: true, tabletsPerSheet: 20 },
    { itemName: 'Atorva 10mg', sku: 'MED-ATO-100', category: 'Tablet', manufacturer: 'Zydus', stockQuantity: 180, reorderLevel: 40, unitPrice: 95.00, expiryDate: '2028-04-30', genericName: 'Atorvastatin', batchNo: 'BAT-ATO-001', rackNo: 'RACK-A4', purchasePrice: 48.00, isSheet: true, tabletsPerSheet: 10 },
    // ── Syrups (sold as bottles, not sheets) ──
    { itemName: 'Benadryl Cough Syrup 100ml', sku: 'SYR-BEN-100', category: 'Syrup', manufacturer: 'Johnson & Johnson', stockQuantity: 80, reorderLevel: 15, unitPrice: 95.00, expiryDate: '2027-09-30', genericName: 'Diphenhydramine', batchNo: 'BAT-BEN-001', rackNo: 'RACK-B1', purchasePrice: 55.00, isSheet: false, tabletsPerSheet: 1 },
    { itemName: 'Grilinctus Syrup 100ml', sku: 'SYR-GRI-100', category: 'Syrup', manufacturer: 'Franco-Indian', stockQuantity: 60, reorderLevel: 10, unitPrice: 82.00, expiryDate: '2027-12-31', genericName: 'Dextromethorphan + CPM', batchNo: 'BAT-GRI-001', rackNo: 'RACK-B1', purchasePrice: 42.00, isSheet: false, tabletsPerSheet: 1 },
    // ── Injections (sold as single vials/ampoules, not sheets) ──
    { itemName: 'Monocef 1g Injection', sku: 'INJ-MON-1G0', category: 'Injection', manufacturer: 'Aristo', stockQuantity: 50, reorderLevel: 10, unitPrice: 180.00, expiryDate: '2027-06-30', genericName: 'Ceftriaxone', batchNo: 'BAT-MON-001', rackNo: 'RACK-C1', purchasePrice: 100.00, isSheet: false, tabletsPerSheet: 1 },
    { itemName: 'Voveran Injection 75mg', sku: 'INJ-VOV-075', category: 'Injection', manufacturer: 'Novartis', stockQuantity: 100, reorderLevel: 20, unitPrice: 35.00, expiryDate: '2028-02-28', genericName: 'Diclofenac Sodium', batchNo: 'BAT-VOV-001', rackNo: 'RACK-C1', purchasePrice: 18.00, isSheet: false, tabletsPerSheet: 1 },
    // ── OT / Surgical Consumables (sold as units) ──
    { itemName: 'Disposable Syringe 5ml', sku: 'CON-SYR-5ML', category: 'OT Consumable', manufacturer: 'Hindustan Syringes', stockQuantity: 500, reorderLevel: 100, unitPrice: 8.00, expiryDate: '2030-01-01', genericName: 'Syringe 5ml', batchNo: 'BAT-SYR-001', rackNo: 'RACK-D1', purchasePrice: 3.50, isSheet: false, tabletsPerSheet: 1 },
    { itemName: 'Surgical Gloves (Pair)', sku: 'CON-GLV-PAR', category: 'OT Consumable', manufacturer: 'Supermax', stockQuantity: 200, reorderLevel: 50, unitPrice: 15.00, expiryDate: '2029-06-30', genericName: 'Latex Surgical Gloves', batchNo: 'BAT-GLV-001', rackNo: 'RACK-D1', purchasePrice: 7.00, isSheet: false, tabletsPerSheet: 1 },
    { itemName: 'IV Cannula 20G', sku: 'CON-IVC-20G', category: 'OT Consumable', manufacturer: 'BD', stockQuantity: 300, reorderLevel: 50, unitPrice: 25.00, expiryDate: '2029-12-31', genericName: 'Intravenous Cannula', batchNo: 'BAT-IVC-001', rackNo: 'RACK-D2', purchasePrice: 12.00, isSheet: false, tabletsPerSheet: 1 },
    { itemName: 'Surgical Suture Silk 3-0', sku: 'CON-SUT-3S0', category: 'OT Consumable', manufacturer: 'Ethicon', stockQuantity: 100, reorderLevel: 20, unitPrice: 120.00, expiryDate: '2028-08-31', genericName: 'Braided Silk Suture', batchNo: 'BAT-SUT-001', rackNo: 'RACK-D2', purchasePrice: 65.00, isSheet: false, tabletsPerSheet: 1 },
    // ── Skin Care / Topical (sold as tubes/units) ──
    { itemName: 'Betadine Ointment 15g', sku: 'SKN-BET-015', category: 'Skin Care', manufacturer: 'Win-Medicare', stockQuantity: 90, reorderLevel: 15, unitPrice: 55.00, expiryDate: '2028-03-31', genericName: 'Povidone Iodine', batchNo: 'BAT-BET-001', rackNo: 'RACK-E1', purchasePrice: 28.00, isSheet: false, tabletsPerSheet: 1 },
    { itemName: 'Candid Cream 30g', sku: 'SKN-CAN-030', category: 'Skin Care', manufacturer: 'Glenmark', stockQuantity: 70, reorderLevel: 10, unitPrice: 110.00, expiryDate: '2027-11-30', genericName: 'Clotrimazole', batchNo: 'BAT-CAN-001', rackNo: 'RACK-E1', purchasePrice: 55.00, isSheet: false, tabletsPerSheet: 1 },
    { itemName: 'Soframycin Cream 30g', sku: 'SKN-SOF-030', category: 'Skin Care', manufacturer: 'Sanofi', stockQuantity: 120, reorderLevel: 20, unitPrice: 75.00, expiryDate: '2028-05-31', genericName: 'Framycetin Sulphate', batchNo: 'BAT-SOF-001', rackNo: 'RACK-E1', purchasePrice: 38.00, isSheet: false, tabletsPerSheet: 1 },
];
const seedPatients = [
    { firstName: 'Rajesh', lastName: 'Kumar', dob: '1980-04-12', gender: 'Male', bloodGroup: 'O+', phone: '9876543211', email: 'rajesh@gmail.com', address: '12, MG Road, Bangalore', allergies: 'Penicillin' },
    { firstName: 'Priyanka', lastName: 'Sharma', dob: '1992-08-24', gender: 'Female', bloodGroup: 'B+', phone: '9876543212', email: 'priyanka@gmail.com', address: '45, Saket, New Delhi', allergies: 'None' },
    { firstName: 'Amit', lastName: 'Patel', dob: '1975-11-05', gender: 'Male', bloodGroup: 'A-', phone: '9876543213', email: 'amit@gmail.com', address: '78, Andheri East, Mumbai', allergies: 'Dust' },
    { firstName: 'Sunita', lastName: 'Rao', dob: '1988-02-19', gender: 'Female', bloodGroup: 'AB+', phone: '9876543214', email: 'sunita@gmail.com', address: '34, Gachibowli, Hyderabad', allergies: 'Pollen' }
];
async function seed() {
    console.log('🌱 Seeding database users...');
    const passwordHash = await bcryptjs_1.default.hash('password123', SALT_ROUNDS);
    for (const user of seedUsers) {
        try {
            const existing = await (0, database_1.query)('SELECT user_id FROM users WHERE email = $1', [user.email]);
            if (existing.rows.length === 0) {
                await (0, database_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name, role)
           VALUES ($1, $2, $3, $4, $5)`, [user.email, passwordHash, user.firstName, user.lastName, user.role]);
                console.log(`✅ Created ${user.role} user: ${user.email}`);
            }
            else {
                console.log(`⚠️ User ${user.email} already exists.`);
            }
        }
        catch (err) {
            console.error(`❌ Failed to create ${user.role} user:`, err.message || err);
        }
    }
    console.log('💊 Seeding database medicines...');
    for (const med of seedMedicines) {
        try {
            const existing = await (0, database_1.query)('SELECT item_id FROM inventory_items WHERE sku = $1', [med.sku]);
            if (existing.rows.length === 0) {
                await (0, database_1.query)(`INSERT INTO inventory_items (item_name, sku, category, manufacturer, stock_quantity, reorder_level, unit_price, expiry_date, generic_name, batch_no, rack_no, purchase_price, is_sheet, tablets_per_sheet)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [med.itemName, med.sku, med.category, med.manufacturer, med.stockQuantity, med.reorderLevel, med.unitPrice, med.expiryDate, med.genericName, med.batchNo, med.rackNo, med.purchasePrice, med.isSheet, med.tabletsPerSheet]);
                console.log(`✅ Created medicine: ${med.itemName}`);
            }
            else {
                // Update existing records with new fields
                await (0, database_1.query)(`UPDATE inventory_items SET category = $1, generic_name = $2, batch_no = $3, rack_no = $4, purchase_price = $5, is_sheet = $6, tablets_per_sheet = $7 WHERE sku = $8`, [med.category, med.genericName, med.batchNo, med.rackNo, med.purchasePrice, med.isSheet, med.tabletsPerSheet, med.sku]);
                console.log(`⚠️ Medicine SKU ${med.sku} already exists. Updated fields.`);
            }
        }
        catch (err) {
            console.error(`❌ Failed to create medicine ${med.itemName}:`, err.message || err);
        }
    }
    // Fetch seeded doctors
    const doctorsRes = await (0, database_1.query)("SELECT user_id FROM users WHERE role = 'Doctor'");
    const doctors = doctorsRes.rows;
    console.log('👤 Seeding database patients...');
    for (let i = 0; i < seedPatients.length; i++) {
        const pat = seedPatients[i];
        try {
            const existing = await (0, database_1.query)('SELECT patient_id FROM patients WHERE phone = $1 OR email = $2', [pat.phone, pat.email]);
            const assignedDoctorId = doctors.length > 0 ? doctors[i % doctors.length].user_id : null;
            if (existing.rows.length === 0) {
                const mrn = await (0, mrnGenerator_1.generateMRN)();
                await (0, database_1.query)(`INSERT INTO patients (medical_record_number, first_name, last_name, date_of_birth, gender, blood_group, phone, email, address, allergies, assigned_doctor_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [mrn, pat.firstName, pat.lastName, pat.dob, pat.gender, pat.bloodGroup, pat.phone, pat.email, pat.address, pat.allergies, assignedDoctorId]);
                console.log(`✅ Created patient: ${pat.firstName} ${pat.lastName} (${mrn})`);
            }
            else {
                const pId = existing.rows[0].patient_id;
                // Update assigned doctor for existing patient to make sure it is populated
                await (0, database_1.query)('UPDATE patients SET assigned_doctor_id = $1 WHERE patient_id = $2', [assignedDoctorId, pId]);
                console.log(`⚠️ Patient ${pat.firstName} ${pat.lastName} already exists. Updated assigned doctor.`);
            }
        }
        catch (err) {
            console.error(`❌ Failed to create/update patient ${pat.firstName} ${pat.lastName}:`, err.message || err);
        }
    }
    console.log('🎉 Seeding completed!');
    process.exit(0);
}
seed();
//# sourceMappingURL=seed.js.map