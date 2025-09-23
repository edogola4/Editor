// This script loads environment variables for Sequelize CLI
import 'dotenv/config';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the configuration
const config = require('../db/config.json');

export default config;
