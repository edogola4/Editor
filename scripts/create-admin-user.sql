-- Create admin user if not exists
INSERT INTO users (id, username, email, password, role, is_verified, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'admin', 
  'admin@example.com', 
  '$2b$10$97N7HRvc28yqtDMQNFPRSe8fH005tpkdXVnGFTAKu/yVJ8fnkQYSa', 
  'admin', 
  true, 
  NOW(), 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- Verify the user was created
SELECT id, email, role, is_verified FROM users WHERE email = 'admin@example.com';
