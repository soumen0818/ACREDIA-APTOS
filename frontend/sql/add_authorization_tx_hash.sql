-- Add authorization transaction hash column to institutions table
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS authorization_tx_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN institutions.authorization_tx_hash IS 'Blockchain transaction hash from when the institution was authorized by admin';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_institutions_auth_tx ON institutions (authorization_tx_hash);