-- Migration to add public sharing feature for medical records
-- Create public_shares table for storing public share links

CREATE TABLE public_shares (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    share_token VARCHAR(64) UNIQUE NOT NULL, -- Unique token for the share link
    password_hash VARCHAR(255), -- Optional password hash (NULL for no password)
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP, -- Optional expiration date
    created_by INTEGER NOT NULL REFERENCES users(id), -- User who created the share
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_public_shares_record_id ON public_shares(record_id);
CREATE INDEX idx_public_shares_share_token ON public_shares(share_token);
CREATE INDEX idx_public_shares_created_by ON public_shares(created_by);
CREATE INDEX idx_public_shares_expires_at ON public_shares(expires_at);

-- Create trigger for updated_at
CREATE TRIGGER update_public_shares_updated_at
    BEFORE UPDATE ON public_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public_shares IS 'Stores public share links for medical records';
COMMENT ON COLUMN public_shares.share_token IS 'Unique token used in public share URLs';
COMMENT ON COLUMN public_shares.password_hash IS 'Optional bcrypt hash for password protection';
COMMENT ON COLUMN public_shares.is_active IS 'Whether the share link is active or disabled';
COMMENT ON COLUMN public_shares.view_count IS 'Number of times the shared record has been viewed';
COMMENT ON COLUMN public_shares.expires_at IS 'Optional expiration date for the share link';
