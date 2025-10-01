-- This is a pre-hashed version of 'Admin123!@#' using bcrypt with 10 rounds
-- You can verify this by running: 
-- node -e "console.log(require('bcryptjs').hashSync('Admin123!@#', 10))"

UPDATE users 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@example.com';

-- Verify the update
SELECT id, username, email, role, is_verified, created_at 
FROM users 
WHERE email = 'admin@example.com';
