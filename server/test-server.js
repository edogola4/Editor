import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

console.log(`Starting simple server on port ${PORT}...`);

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url} from ${req.headers.origin}`);
  next();
});

app.get("/api/health", (req, res) => {
  console.log("Health check requested");
  res.json({ status: "ok", message: "Server is running" });
});

app.post("/api/auth/login", (req, res) => {
  console.log("Login requested:", req.body);
  res.json({
    message: "Login successful",
    user: { id: "test", username: "testuser", email: "test@example.com" },
    accessToken: "test_token",
    refreshToken: "test_refresh_token"
  });
});

app.get("/api/auth/me", (req, res) => {
  console.log("Get current user requested");
  res.json({
    id: "test",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

app.post("/api/auth/register", (req, res) => {
  console.log("Register requested:", req.body);
  res.json({
    message: "User registered successfully",
    user: { id: "test", username: "testuser", email: "test@example.com" },
    accessToken: "test_token",
    refreshToken: "test_refresh_token"
  });
});

app.post("/api/auth/logout", (req, res) => {
  console.log("Logout requested");
  res.json({ message: "Logged out successfully" });
});

app.post("/api/auth/refresh-token", (req, res) => {
  console.log("Refresh token requested");
  res.json({
    accessToken: "new_test_token",
    refreshToken: "new_test_refresh_token"
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Available endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/logout`);
  console.log(`   - POST /api/auth/refresh-token`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('connection', (socket) => {
  console.log('New connection established');
});
