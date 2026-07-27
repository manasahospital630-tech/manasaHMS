-- 1. Modules Master
CREATE TABLE IF NOT EXISTS modules_master (
    module_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_key VARCHAR(100) UNIQUE NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    parent_module_id UUID REFERENCES modules_master(module_id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules_master(module_id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT TRUE,
    can_append BOOLEAN DEFAULT TRUE,
    can_append_to BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE,
    custom_permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, module_id)
);

-- 4. User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Seed Modules Master
INSERT INTO modules_master (module_key, module_name, category, display_order) VALUES
('dashboard', 'Executive Dashboard', 'Core', 1),
('patients', 'Patient Registry & Records', 'Clinical', 2),
('appointments', 'OPD Appointments & Queue', 'Clinical', 3),
('emr', 'EMR & Clinical Encounters', 'Clinical', 4),
('inpatient', 'IPD Beds & Admissions', 'Clinical', 5),
('pharmacy', 'Pharmacy & Dispensary', 'Operations', 6),
('diagnostics', 'Diagnostics & Pathology', 'Diagnostics', 7),
('billing', 'Billing & Financial Invoices', 'Finance', 8),
('emergency', 'Emergency & Trauma Care', 'Critical Care', 9),
('admin', 'Admin Settings & Users', 'Administration', 10),
('security_roles', 'Security Roles & RBAC', 'Administration', 11)
ON CONFLICT (module_key) DO NOTHING;
