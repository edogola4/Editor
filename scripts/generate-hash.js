const bcrypt = require('bcryptjs');

const password = 'admin123'; // Default password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('Password hash:', hash);
  console.log('SQL to update admin password:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@example.com';`);
  
  // Also show the full SQL for creating a new admin user
  console.log('\nFull SQL to create admin user if not exists:');
  console.log(`INSERT INTO users (id, username, email, password, role, is_verified, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'admin', 
  'admin@example.com', 
  '${hash}', 
  'admin', 
  true, 
  NOW(), 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');`);
});
