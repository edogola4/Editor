import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

// Load environment variables
config();

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'collaborative_editor',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: console.log,
});

// Test connection
async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Run the migration manually
    await sequelize.getQueryInterface().createTable('document_permissions', {
      id: {
        type: sequelize.Sequelize.UUID,
        defaultValue: sequelize.Sequelize.UUIDV4,
        primaryKey: true,
      },
      document_id: {
        type: sequelize.Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: sequelize.Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      permission: {
        type: sequelize.Sequelize.ENUM('owner', 'editor', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer',
      },
      created_at: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await sequelize.getQueryInterface().addIndex('document_permissions', ['document_id']);
    await sequelize.getQueryInterface().addIndex('document_permissions', ['user_id']);
    await sequelize.getQueryInterface().addIndex('document_permissions', ['document_id', 'user_id'], {
      unique: true,
    });

    console.log('Migration completed successfully!');
    await sequelize.close();

  } catch (error) {
    console.error('Error running migration:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
