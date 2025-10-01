-- First, delete the existing admin user if it exists
DELETE FROM users WHERE email = 'admin@example.com';

-- Then, create a new admin user with a properly hashed password
INSERT INTO users (
  id, 
  username, 
  email, 
  password, 
  role, 
  is_verified, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin',
  'admin@example.com',
  -- This is a pre-hashed version of 'admin123' with bcrypt
  '$2b$10$cAXym9iRP3gm5TMa2tcIH.4ySaOPCRgMxv6VERwKEjXaN1ugUhc8S',
  'admin',
  true,
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT id, email, role, is_verified FROM users WHERE email = 'admin@example.com';
