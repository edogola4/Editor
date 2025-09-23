import { Sequelize } from 'sequelize';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeds() {
  try {
    console.log('Running database seeds...');
    
    // Run the seed command
    execSync('npx sequelize-cli db:seed:all', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        NODE_OPTIONS: '--loader ts-node/esm',
      },
    });
    
    console.log('Seeds completed successfully!');
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
}

runSeeds();
