-- Hostinger MySQL Seed Script for Hannah Hospital Management System

-- Seed Modules Master
INSERT IGNORE INTO modules_master (module_id, module_key, module_name, category, display_order) VALUES
('m-dash-01', 'dashboard', 'Executive Dashboard', 'Core', 1),
('m-pat-02', 'patients', 'Patient Registry & Records', 'Clinical', 2),
('m-app-03', 'appointments', 'OPD Appointments & Queue', 'Clinical', 3),
('m-emr-04', 'emr', 'EMR & Clinical Encounters', 'Clinical', 4),
('m-ipd-05', 'inpatient', 'IPD Beds & Admissions', 'Clinical', 5),
('m-pha-06', 'pharmacy', 'Pharmacy & Dispensary', 'Operations', 6),
('m-dia-07', 'diagnostics', 'Diagnostics & Pathology', 'Diagnostics', 7),
('m-bil-08', 'billing', 'Billing & Financial Invoices', 'Finance', 8),
('m-eme-09', 'emergency', 'Emergency & Trauma Care', 'Critical Care', 9),
('m-adm-10', 'admin', 'Admin Settings & Users', 'Administration', 10),
('m-sec-11', 'security_roles', 'Security Roles & RBAC', 'Administration', 11);

-- Seed System Roles
INSERT IGNORE INTO roles (role_id, role_name, description, is_system_role, is_active) VALUES
('r-admin-01', 'Admin', 'Full System Administrator Access', true, true),
('r-doc-02', 'Doctor', 'Clinical Consulting Physician', true, true),
('r-nur-03', 'Nurse', 'Ward Nurse & Triage Care', true, true),
('r-rec-04', 'Receptionist', 'Front Desk & Patient Intake', true, true),
('r-pha-05', 'Pharmacist', 'Pharmacy & Inventory Manager', true, true),
('r-bil-06', 'Biller', 'Billing & Accounts Cashier', true, true),
('r-pat-07', 'Patient', 'Patient Self Service Portal', true, true);

-- Seed Role Permissions
INSERT IGNORE INTO role_permissions (id, role_id, module_id, can_view, can_create, can_edit, can_delete, can_append, can_append_to, is_hidden)
SELECT CONCAT('rp-', r.role_id, '-', mm.module_id), r.role_id, mm.module_id, true, true, true, true, true, true, false
FROM roles r
CROSS JOIN modules_master mm;

-- Seed Default System Accounts (Password: password123)
-- bcrypt hash: $2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.
INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_active) VALUES
('u-admin-01', 'admin@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'System', 'Admin', 'Admin', true),
('u-doc-02', 'doctor@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'John', 'Doe', 'Doctor', true),
('u-doc-03', 'aarav.mehta@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'Aarav', 'Mehta', 'Doctor', true),
('u-doc-04', 'priya.nair@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'Priya', 'Nair', 'Doctor', true),
('u-nur-05', 'nurse@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'Clara', 'Barton', 'Nurse', true),
('u-rec-06', 'receptionist@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'Sarah', 'Receptionist', 'Receptionist', true),
('u-pha-07', 'pharmacist@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'Phil', 'Pharmacist', 'Pharmacist', true),
('u-bil-08', 'biller@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'Billy', 'Biller', 'Biller', true),
('u-pat-09', 'patient@hannahhms.com', '$2a$12$zOYrAqqjIqvgFqgOYbD2tuDEdyf7DzPv7/yJwjOqhyapOQFq4bEi.', 'Jane', 'Patient', 'Patient', true);

-- Link Users to Roles
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN roles r ON u.role = r.role_name;

-- Seed Pharmacy Medicines
INSERT IGNORE INTO inventory_items (item_id, item_name, sku, category, manufacturer, stock_quantity, reorder_level, unit_price, expiry_date, generic_name, batch_no, rack_no, purchase_price, is_sheet, tablets_per_sheet) VALUES
('inv-01', 'Crocin 650mg', 'MED-CRO-650', 'Tablet', 'GSK', 400, 50, 30.00, '2028-12-31', 'Paracetamol', 'BAT-CRO-001', 'RACK-A1', 15.00, true, 10),
('inv-02', 'Combiflam', 'MED-COM-100', 'Tablet', 'Sanofi', 300, 50, 45.00, '2027-10-31', 'Ibuprofen + Paracetamol', 'BAT-COM-001', 'RACK-A1', 22.00, true, 10),
('inv-03', 'Pan-D', 'MED-PAN-D01', 'Tablet', 'Alkem', 200, 30, 150.00, '2028-06-30', 'Pantoprazole + Domperidone', 'BAT-PAN-001', 'RACK-A2', 75.00, true, 15),
('inv-04', 'Limcee 500mg', 'MED-LIM-500', 'Tablet', 'Abbott', 500, 100, 25.00, '2029-01-31', 'Ascorbic Acid (Vitamin C)', 'BAT-LIM-001', 'RACK-A2', 12.00, true, 15),
('inv-05', 'Azithral 500mg', 'MED-AZI-500', 'Tablet', 'Alembic', 150, 20, 120.00, '2027-08-31', 'Azithromycin', 'BAT-AZI-001', 'RACK-A3', 60.00, true, 6),
('inv-06', 'Glycomet 500mg', 'MED-GLY-500', 'Tablet', 'USV', 250, 50, 60.00, '2028-11-30', 'Metformin HCl', 'BAT-GLY-001', 'RACK-A3', 30.00, true, 20),
('inv-07', 'Atorva 10mg', 'MED-ATO-100', 'Tablet', 'Zydus', 180, 40, 95.00, '2028-04-30', 'Atorvastatin', 'BAT-ATO-001', 'RACK-A4', 48.00, true, 10);

-- Seed Hospital Settings
INSERT IGNORE INTO hospital_settings (id, hospital_name, hospital_address, phone_number, website, email, gstin, license_info) VALUES
(1, 'Hannah Hospital & Research Center', '12-3-456, Main Road, Hyderabad, Telangana', '+91 98765 43210', 'https://manasahospital.co.in', 'info@manasahospital.co.in', '36AAACH1234F1Z5', 'PR-2026/8508');

-- Seed Hospital Beds (General Ward, Deluxe, ICU, Emergency)
INSERT IGNORE INTO hospital_beds (bed_id, bed_number, ward_name, ward_type, floor, status, daily_rate) VALUES
('bed-101', 'B-101', 'General Ward A', 'General', 1, 'Available', 1500.00),
('bed-102', 'B-102', 'General Ward A', 'General', 1, 'Occupied', 1500.00),
('bed-103', 'B-103', 'General Ward A', 'General', 1, 'Available', 1500.00),
('bed-104', 'B-104', 'General Ward B', 'General', 1, 'Occupied', 1500.00),
('bed-105', 'B-105', 'General Ward B', 'General', 1, 'Available', 1500.00),
('bed-201', 'B-201', 'ICU Special Care', 'ICU', 2, 'Occupied', 5000.00),
('bed-202', 'B-202', 'ICU Special Care', 'ICU', 2, 'Available', 5000.00),
('bed-203', 'B-203', 'ICU Special Care', 'ICU', 2, 'Occupied', 5000.00),
('bed-301', 'B-301', 'Deluxe Private Suite', 'Deluxe', 3, 'Available', 3500.00),
('bed-302', 'B-302', 'Deluxe Private Suite', 'Deluxe', 3, 'Available', 3500.00);

-- Seed Departments
INSERT IGNORE INTO departments (department_id, department_name, department_code, description, is_active) VALUES
('dept-01', 'Cardiology', 'CARD', 'Heart, Vascular & Cardiovascular Care', true),
('dept-02', 'Orthopedics', 'ORTHO', 'Bones, Joints & Musculoskeletal Surgery', true),
('dept-03', 'Pediatrics', 'PED', 'Child & Adolescent Medicine', true),
('dept-04', 'General Medicine', 'GEN', 'Primary Care & Internal Consultations', true),
('dept-05', 'Neurology', 'NEURO', 'Brain, Spine & Nervous System Care', true),
('dept-06', 'Radiology & Imaging', 'RAD', 'X-Ray, Ultrasound, CT & MRI Diagnostics', true),
('dept-07', 'Pathology & Lab', 'PATH', 'Clinical Laboratory & Pathology Services', true),
('dept-08', 'Emergency Care', 'EMERG', '24x7 Trauma & Critical Care Unit', true),
('dept-09', 'Dermatology', 'DERM', 'Skin, Hair & Cosmetic Dermatology', true),
('dept-10', 'Gynecology & Obstetrics', 'GYN', 'Womens Health & Maternity Care', true);
