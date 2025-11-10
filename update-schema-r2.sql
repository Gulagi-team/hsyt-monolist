-- Add R2 storage field to existing medical_records table
-- Run this script to update your existing database

-- Only add R2 URL field - simplified approach
ALTER TABLE medical_records 
ADD COLUMN IF NOT EXISTS r2_url TEXT;

-- Remove unnecessary R2 fields if they exist
ALTER TABLE medical_records 
DROP COLUMN IF EXISTS r2_key,
DROP COLUMN IF EXISTS original_file_name,
DROP COLUMN IF EXISTS file_size,
DROP COLUMN IF EXISTS mime_type;

-- Add comment for documentation
COMMENT ON COLUMN medical_records.r2_url IS 'Public URL to access the file from R2 storage';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
AND column_name = 'r2_url';
