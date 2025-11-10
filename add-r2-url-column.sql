-- Add r2_url column to medical_records table
-- This is a simple migration to add the missing column

ALTER TABLE medical_records 
ADD COLUMN IF NOT EXISTS r2_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN medical_records.r2_url IS 'Public URL to access the file from R2 storage';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
AND column_name = 'r2_url';
