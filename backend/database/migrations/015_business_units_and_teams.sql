-- 1. Business Units Table
CREATE TABLE IF NOT EXISTS business_units (
  bu_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_bu_id VARCHAR(50) REFERENCES business_units(bu_id) ON DELETE SET NULL,
  category VARCHAR(50),
  unit_head_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  team_id VARCHAR(50) PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  bu_id VARCHAR(50) NOT NULL REFERENCES business_units(bu_id) ON DELETE CASCADE,
  team_type VARCHAR(30) DEFAULT 'Owner',
  team_lead_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Team Members Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS team_members (
  team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id)
);

-- 4. Team Security Roles Table
CREATE TABLE IF NOT EXISTS team_security_roles (
  team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (team_id, role)
);

-- Seed Default Business Units
INSERT INTO business_units (bu_id, name, parent_bu_id, category, status) VALUES
('BU-01', 'Clinical OPD & Check-in', NULL, 'Clinical', 'Active'),
('BU-02', 'Inpatient Department (IPD)', NULL, 'Clinical', 'Active'),
('BU-03', 'Emergency & Trauma Care (ICU)', NULL, 'Critical Care', 'Active'),
('BU-04', 'Laboratory & Pathology', NULL, 'Diagnostics', 'Active'),
('BU-05', 'Pharmacy & Dispensing', NULL, 'Pharmacy', 'Active'),
('BU-06', 'Billing, Revenue & Finance', NULL, 'Administration', 'Active'),
('BU-07', 'Reception & Front Desk', NULL, 'Operations', 'Active'),
('BU-08', 'System Administration', NULL, 'IT & Infrastructure', 'Active')
ON CONFLICT (bu_id) DO NOTHING;

-- Seed Default Teams
INSERT INTO teams (team_id, team_name, bu_id, team_type) VALUES
('TEAM-01', 'OPD Clinical Team', 'BU-01', 'Owner'),
('TEAM-02', 'IPD Ward Team', 'BU-02', 'Owner'),
('TEAM-03', 'Emergency Response Team', 'BU-03', 'Owner'),
('TEAM-04', 'Pathology & Lab Techs', 'BU-04', 'Owner'),
('TEAM-05', 'Pharmacy Operations Team', 'BU-05', 'Owner'),
('TEAM-06', 'Billing & Accounts Team', 'BU-06', 'Owner'),
('TEAM-07', 'Front Desk Reception Team', 'BU-07', 'Owner'),
('TEAM-08', 'System IT Admin Team', 'BU-08', 'Owner')
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
