import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import config from './server/db/config.json' assert { type: 'json' };

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
    logging: console.log,
  }
);

async function updateAdminPassword() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!@#', salt);

    // Update the admin user's password
    const [updated] = await sequelize.query(
      `UPDATE users SET password = :password WHERE email = 'admin@example.com'`,
      {
        replacements: { password: hashedPassword },
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    if (updated > 0) {
      console.log('✓ Admin password updated successfully');
      console.log('  Email:    admin@example.com');
      console.log('  Password: Admin123!@#');
    } else {
      console.log('Admin user not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
