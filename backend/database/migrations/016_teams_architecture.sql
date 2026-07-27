-- 1. Ensure Teams Table exists and supports stand-alone Hospital Teams Architecture
CREATE TABLE IF NOT EXISTS teams (
  team_id VARCHAR(50) PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  bu_id VARCHAR(50),
  category VARCHAR(50) DEFAULT 'Clinical',
  team_type VARCHAR(30) DEFAULT 'Owner',
  team_lead_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'Active',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alter bu_id column to be optional if it was previously NOT NULL
ALTER TABLE teams ALTER COLUMN bu_id DROP NOT NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Clinical';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Team Members Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS team_members (
  team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id)
);

-- 3. Team Security Roles Table
CREATE TABLE IF NOT EXISTS team_security_roles (
  team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (team_id, role)
);

-- Seed Default Hospital Teams if empty
INSERT INTO teams (team_id, team_name, category, team_type, status, description) VALUES
('TEAM-01', 'OPD Clinical Team', 'Clinical', 'Owner', 'Active', 'Outpatient doctors, consulting physicians, and reception staff'),
('TEAM-02', 'IPD Ward & Inpatient Team', 'Clinical', 'Owner', 'Active', 'Inpatient ward doctors, duty medical officers, and ward nurses'),
('TEAM-03', 'Emergency & Critical Care Team', 'Critical Care', 'Owner', 'Active', 'Emergency room doctors, ICU specialists, and trauma care nurses'),
('TEAM-04', 'Pathology & Diagnostics Team', 'Diagnostics', 'Owner', 'Active', 'Lab technicians, pathologists, and diagnostic imaging staff'),
('TEAM-05', 'Pharmacy & Dispensing Team', 'Pharmacy', 'Owner', 'Active', 'Pharmacists, dispensing staff, and inventory managers'),
('TEAM-06', 'Billing & Accounts Team', 'Administration', 'Owner', 'Active', 'Revenue accountants, cashier billers, and insurance desks'),
('TEAM-07', 'Front Desk & Reception Team', 'Operations', 'Owner', 'Active', 'Patient registration, appointment schedulers, and helpdesk'),
('TEAM-08', 'Hospital IT & Administration Team', 'IT & Infrastructure', 'Owner', 'Active', 'System administrators, IT support, and executive management')
ON CONFLICT (team_id) DO NOTHING;

-- Seed Default Team Roles
INSERT INTO team_security_roles (team_id, role) VALUES
('TEAM-01', 'Doctor'), ('TEAM-01', 'Nurse'),
('TEAM-02', 'Doctor'), ('TEAM-02', 'Nurse'),
('TEAM-03', 'Doctor'), ('TEAM-03', 'Nurse'),
('TEAM-04', 'Incharge'),
('TEAM-05', 'Pharmacist'),
('TEAM-06', 'Biller'),
('TEAM-07', 'Receptionist'),
('TEAM-08', 'Admin')
ON CONFLICT DO NOTHING;
