-- PostgreSQL Schema for Medical Profile System
-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age INTEGER,
    blood_type VARCHAR(10),
    allergies TEXT,
    current_conditions TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medical_records table with enhanced structure for AI context
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    analysis TEXT NOT NULL,
    
    -- R2 Storage fields
    r2_key VARCHAR(500),
    r2_url TEXT,
    original_file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Enhanced fields for AI context
    structured_data JSONB, -- Store structured medical data
    document_type VARCHAR(50), -- LAB_RESULT, PRESCRIPTION, XRAY, CT_SCAN, MRI, ULTRASOUND, ECG, ENDOSCOPY, PATHOLOGY, DISCHARGE_SUMMARY, MEDICAL_CERTIFICATE, VACCINATION_RECORD, OTHER
    classification_confidence DECIMAL(3,2), -- AI classification confidence
    patient_context JSONB, -- Patient context extracted from document
    
    -- Medical metadata for AI analysis
    test_date DATE,
    doctor_name VARCHAR(255),
    clinic_name VARCHAR(255),
    diagnosis TEXT,
    medications JSONB, -- Array of medications
    test_results JSONB, -- Array of test results
    
    -- AI analysis metadata
    ai_summary TEXT, -- Brief summary for AI context
    key_findings TEXT[], -- Array of key findings
    abnormal_values JSONB, -- Abnormal test values for AI reference
    recommendations TEXT[], -- Medical recommendations
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX idx_medical_records_type ON medical_records(type);
CREATE INDEX idx_medical_records_document_type ON medical_records(document_type);
CREATE INDEX idx_medical_records_test_date ON medical_records(test_date);
CREATE INDEX idx_medical_records_created_at ON medical_records(created_at);

-- Create GIN indexes for JSONB fields for efficient querying
CREATE INDEX idx_medical_records_structured_data ON medical_records USING GIN(structured_data);
CREATE INDEX idx_medical_records_patient_context ON medical_records USING GIN(patient_context);
CREATE INDEX idx_medical_records_medications ON medical_records USING GIN(medications);
CREATE INDEX idx_medical_records_test_results ON medical_records USING GIN(test_results);
CREATE INDEX idx_medical_records_abnormal_values ON medical_records USING GIN(abnormal_values);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON medical_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample user for testing
INSERT INTO users (name, email, password_hash, age, blood_type, allergies, current_conditions, email_verified) 
VALUES 
    ('Test User', 'test@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 30, 'O+', 'Không có', 'Khỏe mạnh', true),
    ('New User', 'newuser@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 25, 'A+', 'Không có', 'Khỏe mạnh', true);

-- Create view for AI context (combines user profile with medical history)
CREATE OR REPLACE VIEW patient_ai_context AS
SELECT 
    u.id as user_id,
    u.name,
    u.age,
    u.blood_type,
    u.allergies,
    u.current_conditions,
    
    -- Recent medical records summary
    COUNT(mr.id) as total_records,
    MAX(mr.created_at) as last_record_date,
    
    -- Aggregate medical data for AI context
    ARRAY_AGG(DISTINCT mr.document_type) FILTER (WHERE mr.document_type IS NOT NULL) as document_types,
    ARRAY_AGG(DISTINCT mr.diagnosis) FILTER (WHERE mr.diagnosis IS NOT NULL AND mr.diagnosis != '') as diagnoses,
    
    -- Recent key findings
    ARRAY_AGG(DISTINCT unnest(mr.key_findings)) FILTER (WHERE mr.key_findings IS NOT NULL) as all_key_findings,
    
    -- Recent recommendations
    ARRAY_AGG(DISTINCT unnest(mr.recommendations)) FILTER (WHERE mr.recommendations IS NOT NULL) as all_recommendations,
    
    -- Latest AI summary for context
    (SELECT ai_summary FROM medical_records WHERE user_id = u.id AND ai_summary IS NOT NULL ORDER BY created_at DESC LIMIT 1) as latest_summary

FROM users u
LEFT JOIN medical_records mr ON u.id = mr.user_id
GROUP BY u.id, u.name, u.age, u.blood_type, u.allergies, u.current_conditions;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medical_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO medical_user;
