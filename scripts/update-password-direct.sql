-- First, let's check if the admin user exists
SELECT id, email, role, is_verified FROM users WHERE email = 'admin@example.com';

-- If the admin user exists, update the password
UPDATE users 
SET 
  password = '$2a$10$3Xc1xWZxX6XxX6XxX6XxXeXxX6XxX6XxX6XxX6XxX6XxX6XxX6XxX6XxX',
  updated_at = NOW()
WHERE email = 'admin@example.com';

-- Verify the update
SELECT id, email, role, is_verified FROM users WHERE email = 'admin@example.com';
