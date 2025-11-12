-- Migration to create public_shares table for PostgreSQL

CREATE TABLE IF NOT EXISTS public_shares (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    share_token VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_shares_record_id ON public_shares(record_id);
CREATE INDEX IF NOT EXISTS idx_public_shares_share_token ON public_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_public_shares_created_by ON public_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_public_shares_expires_at ON public_shares(expires_at);

CREATE OR REPLACE FUNCTION update_public_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_public_shares_updated_at ON public_shares;
CREATE TRIGGER update_public_shares_updated_at
    BEFORE UPDATE ON public_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_public_shares_updated_at();
