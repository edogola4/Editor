-- Create enum types if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_status') THEN
    CREATE TYPE enum_users_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
    CREATE TYPE enum_users_role AS ENUM ('user', 'editor', 'admin', 'owner');
  END IF;
END $$;

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status enum_users_status NOT NULL DEFAULT 'pending_verification',
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS company VARCHAR(255),
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100),
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;

-- Update existing role column if it exists
DO $$
BEGIN
  -- Check if the role column exists and is of type varchar
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'role' 
    AND data_type = 'character varying'
  ) THEN
    -- First, drop any constraints that might be using the role column
    EXECUTE (
      SELECT 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || conname
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass
      AND conname LIKE '%role%'
      LIMIT 1
    );
    
    -- Then alter the column type to the new enum
    ALTER TABLE users 
    ALTER COLUMN role TYPE enum_users_role 
    USING CASE 
      WHEN role = 'admin' THEN 'admin'::enum_users_role 
      WHEN role = 'editor' THEN 'editor'::enum_users_role 
      WHEN role = 'owner' THEN 'owner'::enum_users_role 
      ELSE 'user'::enum_users_role 
    END;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) 
WHERE email_verification_token IS NOT NULL;
