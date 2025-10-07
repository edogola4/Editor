import { User } from '../src/models/index.js';
import bcrypt from 'bcryptjs';
import { sequelize } from '../src/config/database.js';

async function updateAdminPassword() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Find the admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.log('Admin user not found. Creating one...');
      const newAdmin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin123!@#Secure', // Will be hashed by the model
        role: 'admin',
        isVerified: true,
      });
      console.log('Admin user created successfully');
      return;
    }

    // Update the admin password (will be hashed by the beforeUpdate hook)
    adminUser.password = 'Admin123!@#Secure';
    await adminUser.save();
    
    console.log('Admin password updated successfully');
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await sequelize.close();
  }
}

updateAdminPassword();
