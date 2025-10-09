import "module-alias/register";
import moduleAlias from "module-alias";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import session from "express-session";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { config } from "./config/config.js";
import passport from "./config/passport.js";
import { setupSocketIO, cleanupSocketIO } from "./socket/setup.js";
import { db } from "./models/index.js";
import { testConnection } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { redis } from "./config/redis.js";
import { githubRoutes } from "./routes/github.routes.js";
import WebSocketService from "./services/WebSocketService.js";
import { v4 as uuidv4 } from 'uuid';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure module aliases
const rootDir = path.resolve(__dirname, '..');
moduleAlias.addAliases({
  "@db": path.join(rootDir, "db"),
});

// Initialize swagger documentation
const swaggerDocument = YAML.load(
  path.join(__dirname, "../../docs/api/openapi.yaml"),
);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:5000', // Local API server
    'http://localhost:3000', // Common React dev server port
    /https?:\/\/.*\.yourdomain\.com$/, // Your production domain
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  store: new session.MemoryStore(), // Using in-memory store for now
}));
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", (await import("./routes/auth.routes.js")).default);
app.use("/api/documents", (await import("./routes/document.routes.js")).default);
app.use("/api/github", githubRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Collaborative Code Editor Backend API",
    version: process.env.npm_package_version || "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "/api-docs"
    },
    documentation: "/api-docs",
  });
});

// Initialize WebSocket Service
const webSocketService = new WebSocketService(server);

// Document management endpoints
app.get('/api/documents/:id', (req, res) => {
  // In a real app, you would fetch the document from a database
  res.json({
    id: req.params.id,
    content: '',
    language: 'plaintext',
    users: []
  });
});

app.post('/api/documents', (req, res) => {
  const documentId = uuidv4();
  res.status(201).json({
    id: documentId,
    content: '',
    language: 'plaintext',
    users: []
  });
});

// API Documentation with Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    console.log("✅ Database connected successfully");
    
    const serverInstance = server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: http://localhost:${process.env.FRONTEND_PORT || 5173}`);
      console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Handle server errors
    serverInstance.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    return serverInstance;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await cleanupSocketIO();
  
  // Close HTTP server
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
