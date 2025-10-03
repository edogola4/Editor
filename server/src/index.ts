import "module-alias/register";
import moduleAlias from "module-alias";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import session from "express-session";
import { config } from "./config/config.js";
import passport from "./config/passport.js";
import { setupSocketIO, cleanupSocketIO } from "./socket/setup.js";
import { testConnection } from "../db/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { redis } from "./config/redis.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure module aliases
moduleAlias.addAliases({
  "@db": path.join(__dirname, "../db"),
});

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
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
app.use("/api/users", (await import("./routes/user.routes.js")).default);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Setup Socket.IO
setupSocketIO(server);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    console.log("✅ Database connected successfully");
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: http://localhost:${process.env.FRONTEND_PORT || 5173}`);
      console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api-docs`);
    });
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
