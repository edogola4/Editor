import { Sequelize, Model, ModelStatic } from 'sequelize';
import 'reflect-metadata'; // Required for decorator metadata
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import model types without initializing them
import type { UserModelStatic } from '../models/EnhancedUser.js';
import type { ModelStatic as SequelizeModelStatic } from 'sequelize';
import type Document from '../models/Document.js';
import type DocumentPermission from '../models/DocumentPermission.js';
import type Operation from '../models/Operation.js';
import type Room from '../models/Room.js';
import type RoomMember from '../models/RoomMember.js';
import type RoomActivity from '../models/RoomActivity.js';
import type RoomInvitation from '../models/RoomInvitation.js';
import type Session from '../models/Session.js';
import type Log from '../models/Log.js';
import type DocumentVersion from '../models/DocumentVersion.js';

export const dbInit = async (): Promise<Sequelize> => {
  console.log('Initializing database connection...');

  // Check if we're in development and should use SQLite instead of PostgreSQL
  const useSQLite = process.env.NODE_ENV === 'development' && (
    !process.env.DB_HOST ||
    process.env.DB_HOST === 'localhost'
  );

  let sequelize: Sequelize;

  if (useSQLite) {
    console.log('🔄 Using SQLite for development (PostgreSQL not available)');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../data/database.sqlite'),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    console.log('🔌 Connecting to PostgreSQL database...');
    sequelize = new Sequelize({
      database: process.env.DB_NAME || "collaborative_editor",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      dialect: "postgres",
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  }

  try {
    // Step 1: Authenticate database connection
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");

    // Import models dynamically to avoid circular dependencies
    const { User: UserModel } = await import('../models/EnhancedUser.js');
    const { default: Document } = await import('../models/Document.js');
    const { default: DocumentPermission } = await import('../models/DocumentPermission.js');
    const { default: Operation } = await import('../models/Operation.js');
    const { default: Room } = await import('../models/Room.js');
    const { default: RoomMember } = await import('../models/RoomMember.js');
    const { default: RoomActivity } = await import('../models/RoomActivity.js');
    const { default: RoomInvitation } = await import('../models/RoomInvitation.js');
    const { default: Session } = await import('../models/Session.js');
    const { default: Log } = await import('../models/Log.js');
    const { default: DocumentVersion } = await import('../models/DocumentVersion.js');

    // Define core models that don't depend on others
    const coreModels = [
      { name: 'User', model: UserModel, isFunction: true },
      { name: 'Document', model: Document, isFunction: false },
      { name: 'Room', model: Room, isFunction: true },
      { name: 'Session', model: Session, isFunction: false },
      { name: 'Log', model: Log, isFunction: true }
    ];

    // Define models that might depend on core models
    const dependentModels = [
      { name: 'DocumentPermission', model: DocumentPermission, isFunction: false },
      { name: 'DocumentVersion', model: DocumentVersion, isFunction: true },
      { name: 'Operation', model: Operation, isFunction: true },
      { name: 'RoomMember', model: RoomMember, isFunction: true },
      { name: 'RoomActivity', model: RoomActivity, isFunction: true },
      { name: 'RoomInvitation', model: RoomInvitation, isFunction: true },
    ];

    // Track initialized models
    const initializedModels: Record<string, any> = {};
    const originalModels: Record<string, any> = {};

    // Helper function to check if a model is a class (including those with @Table)
    const isClassModel = (model: any): boolean => {
      return typeof model === 'function' &&
             model.prototype &&
             model.prototype.constructor &&
             model.name !== 'Model';
    };

    // Helper function to initialize a single model
    const initializeModel = async (name: string, model: any, isFunction: boolean) => {
      try {
        console.log(`🔍 Initializing ${isFunction ? 'function' : 'class'} model: ${name}`);

        if (isFunction) {
          // For function-based models (like EnhancedUser)
          try {
            const initialized = model(sequelize);
            initializedModels[name] = initialized;
            // For associations, we need the initialized model instance
            originalModels[name] = initialized;
            console.log(`✅ Initialized function model: ${name}`);
          } catch (e) {
            console.error(`❌ Error initializing function model ${name}:`, e);
            throw e;
          }
        } else {
          // For class-based models (with @Table decorator)
          try {
            // For class-based models, we need to ensure they're properly initialized
            // Check if model is already in Sequelize's model manager
            let sequelizeModel = sequelize.models[name];

            if (!sequelizeModel) {
              // For class-based models with decorators, we need to initialize them properly
              if (isClassModel(model)) {
                // Use Sequelize's model manager to add the model
                sequelize.modelManager.addModel(model);
                sequelizeModel = sequelize.models[name];
              } else {
                throw new Error(`Model ${name} is not a valid class model`);
              }
            }

            if (sequelizeModel) {
              initializedModels[name] = sequelizeModel;
              // For associations, we need the Sequelize model instance from sequelize.models
              originalModels[name] = sequelizeModel;
              console.log(`✅ Added class model: ${name}`);
            } else {
              throw new Error(`Failed to initialize model ${name}`);
            }
          } catch (e) {
            console.error(`❌ Error initializing class model ${name}:`, e);
            throw e;
          }
        }

        return true;
      } catch (error) {
        console.error(`❌ Error initializing model ${name}:`, error);
        throw error;
      }
    };

    // Initialize all models one by one with proper error handling
    console.log('\n🚀 Starting model initialization...');
    const allModels = [...coreModels, ...dependentModels];
    let successCount = 0;

    // First pass: Initialize all models
    for (const { name, model, isFunction } of allModels) {
      try {
        await initializeModel(name, model, isFunction);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to initialize model ${name}:`, errorMsg);
        if (error instanceof Error && error.stack) {
          console.error(error.stack.split('\n').slice(0, 3).join('\n'));
        }
        throw new Error(`Failed to initialize model ${name}: ${errorMsg}`);
      }
    }

    console.log(`\n✅ Successfully initialized ${successCount}/${allModels.length} models`);

    // Set up associations after all models are initialized
    console.log('Setting up model associations...');
    try {
      // Import setupAssociations from the fixed associations file
      const { setupAssociations } = await import('../models/associations_fixed.js');
      if (typeof setupAssociations === 'function') {
        // Use the properly initialized models from initializedModels
        const models = originalModels as any;

        // Verify all models are present
        for (const [name, model] of Object.entries(models)) {
          if (!model) {
            throw new Error(`Model ${name} is not properly initialized`);
          }
        }

        // Setup associations with properly initialized models
        console.log('🔗 Setting up associations with models:', Object.keys(originalModels));
        setupAssociations(sequelize, originalModels);
        console.log('✅ Model associations configured');
      } else {
        console.warn('⚠️ setupAssociations is not a function, skipping associations');
      }
    } catch (error) {
      console.error('❌ Error setting up associations:', error);
      throw error;
    }

    // Sync database schema
    await sequelize.sync({
      alter: process.env.NODE_ENV !== 'production',
      force: false
    });
    console.log("✅ Database synchronized successfully");

    return sequelize;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};
