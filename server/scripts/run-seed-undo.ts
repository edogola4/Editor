import { Sequelize } from 'sequelize';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function undoSeeds() {
  try {
    console.log('Undoing database seeds...');
    
    // Run the seed:undo command
    execSync('npx sequelize-cli db:seed:undo:all', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        NODE_OPTIONS: '--loader ts-node/esm',
      },
    });
    
    console.log('Seed undo completed successfully!');
  } catch (error) {
    console.error('Error undoing seeds:', error);
    process.exit(1);
  }
}

undoSeeds();
