import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseInitializer {
  private sequelize: Sequelize;
  private dbName: string;
  private dbUser: string;
  private dbPassword: string;
  private dbHost: string;
  private dbPort: number;

  constructor() {
    this.dbName = process.env.DB_NAME || 'collab_editor';
    this.dbUser = process.env.DB_USER || 'postgres';
    this.dbPassword = process.env.DB_PASSWORD || 'postgres';
    this.dbHost = process.env.DB_HOST || 'localhost';
    this.dbPort = parseInt(process.env.DB_PORT || '5432', 10);

    // Connect to the default 'postgres' database to create a new database
    this.sequelize = new Sequelize('postgres', this.dbUser, this.dbPassword, {
      host: this.dbHost,
      port: this.dbPort,
      dialect: 'postgres',
      logging: (msg) => logger.debug(msg),
    });
  }

  /**
   * Initialize the database by creating it if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await this.createDatabaseIfNotExists();
      await this.runMigrations();
      await this.seedDatabase();
      logger.info('Database initialization completed successfully');
    } catch (error) {
      logger.error('Failed to initialize database', { error });
      throw error;
    } finally {
      await this.sequelize.close();
    }
  }

  /**
   * Create the database if it doesn't exist
   */
  private async createDatabaseIfNotExists(): Promise<void> {
    try {
      // Check if database exists
      const result = await this.sequelize.query(
        `SELECT 1 FROM pg_database WHERE datname = '${this.dbName}';`,
        { type: 'SELECT' }
      );

      if (result.length === 0) {
        logger.info(`Creating database: ${this.dbName}`);
        await this.sequelize.query(`CREATE DATABASE "${this.dbName}"`);
        logger.info(`Database ${this.dbName} created successfully`);
      } else {
        logger.info(`Database ${this.dbName} already exists`);
      }
    } catch (error) {
      logger.error('Error creating database', { error });
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    try {
      logger.info('Running database migrations...');
      
      // Use the migration script from the build directory
      const migrationScript = path.join(process.cwd(), 'node_modules/.bin/sequelize-cli');
      
      // Run migrations
      execSync(`npx sequelize-cli db:migrate`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'development',
          DB_NAME: this.dbName,
          DB_USER: this.dbUser,
          DB_PASSWORD: this.dbPassword,
          DB_HOST: this.dbHost,
          DB_PORT: this.dbPort.toString(),
        },
      });
      
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Error running migrations', { error });
      throw error;
    }
  }

  /**
   * Seed the database with initial data
   */
  private async seedDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      try {
        logger.info('Seeding database...');
        
        // Run seeders
        execSync('npx sequelize-cli db:seed:all', {
          stdio: 'inherit',
          env: {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV || 'development',
            DB_NAME: this.dbName,
            DB_USER: this.dbUser,
            DB_PASSWORD: this.dbPassword,
            DB_HOST: this.dbHost,
            DB_PORT: this.dbPort.toString(),
          },
        });
        
        logger.info('Database seeding completed successfully');
      } catch (error) {
        logger.error('Error seeding database', { error });
        throw error;
      }
    } else {
      logger.info('Skipping database seeding in production');
    }
  }
}

// Run the database initialization
const initDb = async () => {
  try {
    const initializer = new DatabaseInitializer();
    await initializer.initialize();
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

initDb();
