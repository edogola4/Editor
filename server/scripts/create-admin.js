// This script requires the server to be configured with the correct database connection
import { User } from '../src/models/index.js';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({
      where: { email: 'admin@example.com' },
    });

    if (adminExists) {
      console.log('✓ Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123!@#',
      role: 'admin',
      isVerified: true,
    });

    console.log('\n✓ Admin user created successfully');
    console.log('  Email:    admin@example.com');
    console.log('  Password: Admin123!@#');
    console.log('  Role:     admin');
    console.log('  ID:       ', adminUser.id);
    console.log('\nYou can now log in with these credentials.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser();
