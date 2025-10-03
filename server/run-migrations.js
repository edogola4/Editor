const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Umzug, SequelizeStorage } = require('umzug');
const config = require('./db/config.json');

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

const runMigrations = async () => {
  try {
    console.log('Running migrations...');
    
    // Ensure the migrations table exists
    await sequelize.getQueryInterface().createTable('SequelizeMeta', {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: false,
      },
    });

    // Get list of migration files
    const migrationsPath = path.join(__dirname, 'dist/db/migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        name: file.replace('.js', ''),
        path: path.join(migrationsPath, file)
      }));

    // Apply each migration
    for (const migration of migrationFiles) {
      try {
        // Check if migration has already been run
        const [results] = await sequelize.query(
          'SELECT * FROM "SequelizeMeta" WHERE "name" = ?',
          { replacements: [migration.name] }
        );

        if (results.length === 0) {
          console.log(`Running migration: ${migration.name}`);
          const migrationModule = require(migration.path);
          
          if (migrationModule.up) {
            await migrationModule.up(
              sequelize.getQueryInterface(),
              Sequelize.DataTypes
            );
            
            // Record the migration
            await sequelize.query(
              'INSERT INTO "SequelizeMeta" ("name") VALUES (?)',
              { replacements: [migration.name] }
            );
            
            console.log(`Applied migration: ${migration.name}`);
          }
        } else {
          console.log(`Migration already applied: ${migration.name}`);
        }
      } catch (error) {
        console.error(`Error applying migration ${migration.name}:`, error);
        throw error;
      }
    }
    
    console.log('All migrations have been applied successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

runMigrations();
