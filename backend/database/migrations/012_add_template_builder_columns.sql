CREATE TABLE IF NOT EXISTS diagnostic_parameters (
    parameter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES diagnostic_services(service_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    reference_range TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE diagnostic_services ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'Structured';

ALTER TABLE diagnostic_parameters 
ADD COLUMN IF NOT EXISTS input_type VARCHAR(50) DEFAULT 'Number',
ADD COLUMN IF NOT EXISTS dropdown_options VARCHAR(255),
ADD COLUMN IF NOT EXISTS min_value NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS max_value NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS age_group VARCHAR(50) DEFAULT 'Universal',
ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'Universal';

