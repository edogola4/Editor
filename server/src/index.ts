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
import { setupSocketIO, cleanupSocketIO } from "./socket/setup.js";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import { testConnection } from "../db/index.js";
import { execSync } from "child_process";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authenticate, authorize } from "./middleware/auth.js";
import { Room, User, DocumentOperation } from "./socket/types/events.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/document.routes.js";
import roomRoutes from "./routes/room.routes.js";
import devRoutes from "./routes/dev.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with our custom setup
const socketService = setupSocketIO(server);
const io = socketService.getIO();

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

// API Documentation
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Collaborative Code Editor Backend API",
    version: "1.0.0",
    documentation: "https://github.com/yourusername/collaborative-code-editor/blob/main/API_DOCUMENTATION.md",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      documents: "/api/documents",
      rooms: "/api/rooms",
      health: "/api/health"
    },
  });
});

// API v1 routes
const apiRouter = express.Router();

// API root endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    status: "ok",
    message: "Collaborative Code Editor API v1",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      documents: "/api/documents",
      rooms: "/api/rooms",
      health: "/api/health",
      dev: process.env.NODE_ENV !== 'production' ? "/api/dev" : undefined
    },
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/rooms', roomRoutes);

// Development routes (only enabled in development)
if (process.env.NODE_ENV !== 'production') {
  apiRouter.use('/dev', devRoutes);
}

// Add API versioning
app.use('/api', apiRouter);

app.get("/api/health", async (req, res) => {
  try {
    // Check database connection
    await testConnection();
    
    // Get system stats
    const stats = {
      status: "ok",
      message: "Server is running",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      connections: io.sockets.sockets.size,
      documents: socketService ? 'active' : 'inactive',
    };
    
    return res.json(stats);
  } catch (error) {
    return res.status(503).json({
      status: "error",
      message: "Service unavailable",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/rooms", roomRoutes);

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
  socket.on("room:join", (payload, callback) => {
    const { roomId } = payload;
    console.log(`📄 User ${userId} attempting to join document: ${roomId}`);

    socket.join(`document:${roomId}`);
    console.log(`✅ User ${userId} successfully joined document ${roomId}`);

    // Create a mock room object
    const mockRoom: Room = {
      id: roomId,
      name: `Room ${roomId}`,
      owner: userId,
      members: new Set([userId]),
      maxMembers: 10,
      createdAt: new Date()
    };

    // Create mock user object
    const user: User = {
      id: userId,
      username: `user_${userId.slice(0, 6)}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };

    // Call the callback with success response
    if (callback) {
      callback({ 
        success: true,
        user: user
      });
    }

    // Notify other users in the document
    socket.to(`document:${roomId}`).emit('room:joined', {
      room: {
        id: mockRoom.id,
        name: mockRoom.name,
        owner: mockRoom.owner,
        maxMembers: mockRoom.maxMembers,
        createdAt: mockRoom.createdAt
      },
      members: [user]
    });

    // Send current document state to the new user
    socket.emit('document:state', {
      content: `// Welcome to Collaborative Code Editor!
// Start typing your code here...

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // Output: 55`,
      version: 1
    });

    console.log(`📤 Sent document state to user ${userId}`);
  });

  socket.on("room:leave", (payload) => {
    const { roomId } = payload;
    socket.leave(`document:${roomId}`);
    console.log(`🚪 User ${userId} left document ${roomId}`);

    // Notify other users
    socket.to(`document:${roomId}`).emit('room:left', {
      userId,
      roomId: `document:${roomId}`
    });
  });

  // Handle code changes
  socket.on("document:operation", (operation, callback) => {
    const { text, position, type, version } = operation;
    const roomId = socket.data.roomId || 'default';

    console.log(`📝 ${type} operation from ${userId} in document ${roomId} at position ${position}`);

    // Create the full operation with required fields
    const fullOperation: DocumentOperation = {
      ...operation,
      clientId: socket.id,
      timestamp: Date.now(),
      userId
    };

    // Broadcast to all users in the same document except sender
    socket.to(`document:${roomId}`).emit('document:operation', fullOperation);

    // Acknowledge the operation
    if (callback) {
      callback({ success: true });
    }
  });

  // Handle document sync
  socket.on("document:sync", (payload) => {
    const { version } = payload;
    const roomId = socket.data.roomId || 'default';

    console.log(`🔄 Document sync requested by ${userId} for version ${version} in room ${roomId}`);

    // In a real implementation, you would send the current document state
    // Here we just acknowledge the sync request
    socket.emit('document:state', { content: '', version });
  });

  // Handle cursor position updates
  socket.on("cursor:move", (position) => {
    const roomId = socket.data.roomId || 'default';
    
    console.log(`🎯 Cursor update from ${userId} in room ${roomId}:`, position);

    // Update user's cursor position in the room service
    if (socket.data.user) {
      socket.data.user.cursorPosition = position;
    }

    // Broadcast cursor position to all users in the same room except sender
    socket.to(`document:${roomId}`).emit('cursor:update', {
      userId,
      position
    });
  });

  // Handle user typing indicators
  socket.on("user:typing", (payload) => {
    const { isTyping, roomId } = payload;
    const targetRoomId = roomId || socket.data.roomId || 'default';

    console.log(`⌨️ User ${userId} ${isTyping ? 'started' : 'stopped'} typing in room ${targetRoomId}`);

    // Broadcast typing status to all users in the same room except sender
    socket.to(`document:${targetRoomId}`).emit('user:typing', {
      userId,
      isTyping
    });
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", userId);
    console.log("📊 Remaining connected clients:", io.sockets.sockets.size);

    // Notify all documents that this user left
    // In a real implementation, you'd track which documents the user was in
    const roomId = socket.data.roomId || 'default';
    socket.to(`document:${roomId}`).emit('room:left', {
      userId,
      roomId: `document:${roomId}`
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
    // Test database connection (skip in development if not available)
    try {
      const connected = await testConnection();
      if (!connected) {
        console.warn("⚠️ Database connection failed - running in mock mode");
      } else {
        console.log("✅ Database connected successfully");
      }
    } catch (error) {
      console.warn("⚠️ Database connection failed - running in mock mode:", error.message);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: http://localhost:5173`);
      console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/`);
      console.log(`🔐 Authentication: Mock mode enabled for development`);
      console.log(`🔄 Real-time collaboration enabled with Socket.IO`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await cleanupSocketIO();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await cleanupSocketIO();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

startServer();
