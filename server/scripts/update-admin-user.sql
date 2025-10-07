-- Update the admin user with all required fields
UPDATE users 
SET 
  status = 'active'::enum_users_status,
  first_name = 'Admin',
  last_name = 'User',
  bio = 'System Administrator',
  company = 'Collaborative Editor',
  location = 'Internet',
  website = 'https://collaborative-editor.example.com',
  email_notifications = true,
  two_factor_enabled = false,
  is_verified = true,
  updated_at = NOW()
WHERE email = 'admin@example.com';

-- Verify the update
SELECT id, username, email, status, is_verified, role, created_at, updated_at 
FROM users 
WHERE email = 'admin@example.com';
