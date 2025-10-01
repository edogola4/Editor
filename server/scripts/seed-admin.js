import { User } from '../src/models/index.js';
import bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';
import config from '../db/config.json';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

async function seedAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
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

    console.log('✓ Admin user created successfully');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin123!@#');
    console.log('  Role: admin');
    console.log('  ID:', adminUser.id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdminUser();
