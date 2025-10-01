const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Hashed password:', hash);
  console.log('\nSQL to update password:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@example.com';`);
}

hashPassword().catch(console.error);
