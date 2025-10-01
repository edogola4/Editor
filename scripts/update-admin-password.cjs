const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const config = require('../server/db/config.json');

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
      console.log('Admin user not found. Creating admin user...');
      
      // Create admin user if not exists
      await sequelize.query(
        `INSERT INTO users (id, username, email, password, role, "isVerified", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), 'admin', 'admin@example.com', :password, 'admin', true, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE 
         SET password = EXCLUDED.password, "updatedAt" = NOW()
         RETURNING id`,
        {
          replacements: { password: hashedPassword },
          type: sequelize.QueryTypes.INSERT
        }
      );
      
      console.log('✓ Admin user created/updated successfully');
      console.log('  Email:    admin@example.com');
      console.log('  Password: Admin123!@#');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
