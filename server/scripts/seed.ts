#!/usr/bin/env node
import db from '../src/models/index.js';
const { sequelize } = db;
import { runSeeds } from '../db/seeds/admin-user.seed.js';

async function main() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Drop and recreate all tables
    console.log('Dropping and recreating tables...');
    await sequelize.sync({ force: true });
    console.log('✓ Database synchronized successfully\n');

    // Run seeds
    console.log('🌱 Starting database seeding...\n');
    await runSeeds();
    console.log('\n✓ Seeding completed successfully!');

    console.log('\nClosing database connection...');
    await sequelize.close();
    console.log('✓ Done!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();
