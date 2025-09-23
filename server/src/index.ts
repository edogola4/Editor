import "module-alias/register";
import moduleAlias from "module-alias";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure module aliases
moduleAlias.addAliases({
  "@db": path.join(__dirname, "../db"),
});

import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import { testConnection } from "../db/index.js";
import { execSync } from "child_process";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authenticate, authorize } from "./middleware/auth.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Collaborative Code Editor Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      // Add more endpoints as they are implemented
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Authentication routes
app.post("/api/auth/register", async (req, res, next) => {
  try {
    // TODO: Implement user registration
    res.json({ message: "Registration endpoint - to be implemented" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    // TODO: Implement user login
    res.json({ message: "Login endpoint - to be implemented" });
  } catch (error) {
    next(error);
  }
});

// Protected route example
app.get("/api/auth/profile", authenticate, async (req, res, next) => {
  try {
    res.json({
      message: "Protected route",
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Handle document operations
  socket.on("document:join", (data) => {
    socket.join(`document:${data.documentId}`);
    console.log(`User ${socket.id} joined document ${data.documentId}`);
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Database connection failed");
    }

    // Run migrations using node-pg-migrate
    try {
      execSync("npm run db:migrate", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: http://localhost:5173`);
      console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
