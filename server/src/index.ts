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
  console.log("🔌 New WebSocket connection:", socket.id);
  console.log("📊 Total connected clients:", io.sockets.sockets.size);

  // Get user ID from auth or generate one
  const userId = socket.handshake.auth.userId || `user_${socket.id}`;
  console.log("👤 User connected with ID:", userId);

  // Join user to their personal room for direct communication
  socket.join(`user:${userId}`);
  console.log("🏠 User joined personal room: user:" + userId);

  // Handle document operations
  socket.on("document:join", (data) => {
    const { documentId } = data;
    console.log(`📄 User ${userId} attempting to join document: ${documentId}`);

    socket.join(`document:${documentId}`);
    console.log(`✅ User ${userId} successfully joined document ${documentId}`);

    // Get current users in the document room
    const room = io.sockets.adapter.rooms.get(`document:${documentId}`);
    const userIds = room ? Array.from(room).map(id => {
      // Extract user ID from socket ID or use the stored one
      return id.startsWith('user_') ? id : userId;
    }) : [];

    console.log(`👥 Users in document ${documentId}:`, userIds);

    // Notify other users in the document
    socket.to(`document:${documentId}`).emit('user-joined', {
      userId,
      timestamp: new Date().toISOString()
    });

    // Send current document state to the new user
    socket.emit('document:state', {
      code: `// Welcome to Collaborative Code Editor!
// Start typing your code here...

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // Output: 55`,
      language: 'javascript',
      users: userIds.filter(id => id !== userId) // Exclude current user
    });

    console.log(`📤 Sent document state to user ${userId}`);
  });

  socket.on("document:leave", (data) => {
    const { documentId } = data;
    socket.leave(`document:${documentId}`);
    console.log(`🚪 User ${userId} left document ${documentId}`);

    // Notify other users
    socket.to(`document:${documentId}`).emit('user-left', {
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle code changes
  socket.on("code-change", (data) => {
    const { code, documentId = 'default' } = data;

    console.log(`📝 Code change from ${userId} in document ${documentId}: ${code.length} characters`);

    // Broadcast to all users in the same document except sender
    socket.to(`document:${documentId}`).emit('code-change', {
      code,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle language changes
  socket.on("language-change", (data) => {
    const { language, documentId = 'default' } = data;

    console.log(`🌐 Language change from ${userId} in document ${documentId}: ${language}`);

    socket.to(`document:${documentId}`).emit('language-change', {
      language,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle cursor position updates
  socket.on("cursor-update", (data) => {
    const { position, documentId = 'default' } = data;

    console.log(`🎯 Cursor update from ${userId} in document ${documentId}:`, position);

    // Broadcast cursor position to all users in the same document
    socket.to(`document:${documentId}`).emit('cursor-update', {
      userId,
      position,
      timestamp: new Date().toISOString()
    });
  });

  // Handle user typing indicators
  socket.on("typing:start", (data) => {
    const { documentId = 'default' } = data;

    console.log(`⌨️ Typing started by ${userId} in document ${documentId}`);

    socket.to(`document:${documentId}`).emit('typing:start', {
      userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("typing:stop", (data) => {
    const { documentId = 'default' } = data;

    console.log(`⌨️ Typing stopped by ${userId} in document ${documentId}`);

    socket.to(`document:${documentId}`).emit('typing:stop', {
      userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", userId);
    console.log("📊 Remaining connected clients:", io.sockets.sockets.size);

    // Notify all documents that this user left
    // In a real implementation, you'd track which documents the user was in
    io.emit('user-left', {
      userId,
      timestamp: new Date().toISOString()
    });
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
