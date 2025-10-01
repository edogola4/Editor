const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

async function fixAdminPassword() {
  try {
    // Create a new Sequelize instance
    const sequelize = new Sequelize('collaborative_editor', 'postgres', '', {
      host: 'localhost',
      port: 5432,
      dialect: 'postgres',
      logging: console.log,
    });

    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Hash the password
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Hashed password:', hashedPassword);

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
      console.log('  Password: admin123');
    } else {
      console.log('Admin user not found');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAdminPassword();
