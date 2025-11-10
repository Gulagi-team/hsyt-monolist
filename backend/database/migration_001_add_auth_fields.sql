-- Migration to add authentication fields to existing users table
-- Run this script if you have an existing database with the old schema

USE medical_profile;

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255) NULL,
ADD COLUMN reset_password_token VARCHAR(255) NULL,
ADD COLUMN reset_password_expires TIMESTAMP NULL;

-- Make age, blood_type, allergies, current_conditions have default values
ALTER TABLE users 
MODIFY COLUMN age INT DEFAULT 30,
MODIFY COLUMN blood_type VARCHAR(10) DEFAULT 'O+',
MODIFY COLUMN allergies TEXT DEFAULT 'Không có',
MODIFY COLUMN current_conditions TEXT DEFAULT 'Khỏe mạnh';

-- Add unique constraint on email after adding the column
ALTER TABLE users ADD UNIQUE KEY idx_email_unique (email);

-- Add indexes for performance
CREATE INDEX idx_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_reset_password_token ON users(reset_password_token);

-- Update existing users to have a default email (you may want to customize this)
-- UPDATE users SET email = CONCAT(LOWER(REPLACE(name, ' ', '')), '@example.com') WHERE email = '';

-- Note: You'll need to manually set passwords for existing users or they won't be able to log in
-- with the new authentication system
