-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    github_id VARCHAR(255),
    avatar_url VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert the admin user if it doesn't exist
INSERT INTO users (username, email, password, role, is_verified, created_at, updated_at)
SELECT 'admin', 'admin@example.com', 
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password is 'Admin123!@#'
       'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@example.com'
);

-- Show the created admin user
SELECT id, username, email, role, is_verified, created_at 
FROM users 
WHERE email = 'admin@example.com';
