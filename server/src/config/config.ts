import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { access } from 'fs/promises';
import { fileURLToPath as _fileURLToPath } from 'url';

const __filename = _fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load initial .env file if it exists
try {
  const envPath = path.resolve(__dirname, "../../.env");
  await access(envPath);
  dotenv.config({ path: envPath });
} catch (error) {
  console.warn('No .env file found, using process.env');
}

interface Config {
  env: string;
  port: number;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpirationMinutes: number;
    refreshExpirationDays: number;
  };
  redis: {
    host: string;
    port: number;
    url: string;
  };
  session: {
    secret: string;
    name: string;
    cookieMaxAge: number;
  };
  github: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  serverUrl: string;
}


const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'collaborative_editor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_here',
    accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || '15', 10),
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your_session_secret_here',
    name: process.env.SESSION_NAME || 'sid',
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:5173',
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per windowMs
  },
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
};

export { config };
