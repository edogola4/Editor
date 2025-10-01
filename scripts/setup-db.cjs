const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read config file
const configPath = path.join(__dirname, 'server/db/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

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

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Define the User model
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
      githubId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'github_id',
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'avatar_url',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'password_reset_token',
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'password_reset_expires',
      },
    }, {
      tableName: 'users',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    });

    // Create the table if it doesn't exist
    await User.sync({ force: true });
    console.log('✓ Users table created successfully');

    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminExists) {
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
    } else {
      console.log('✓ Admin user already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
