import request from "supertest";
import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "../src/app";

describe("API Endpoints", () => {
  let server: any;
  let io: SocketServer;

  beforeAll((done) => {
    server = app.listen(3001, () => {
      const httpServer = createServer(app);
      io = new SocketServer(httpServer, {
        cors: {
          origin: ["http://localhost:3000", "http://localhost:5173"],
          methods: ["GET", "POST"],
          credentials: true,
        },
      });
      done();
    });
  });

  afterAll((done) => {
    if (io) {
      io.close();
    }
    server.close(done);
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("GET /api-docs", () => {
    it("should return API documentation", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.text).toContain("Swagger");
    });
  });

  describe("Authentication Endpoints", () => {
    describe("POST /api/auth/register", () => {
      it("should register a new user", async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
          })
          .expect(201);

        expect(response.body).toHaveProperty(
          "message",
          "User registered successfully",
        );
      });

      it("should return error for existing user", async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            username: "admin",
            email: "admin@example.com",
            password: "password123",
          })
          .expect(400);

        expect(response.body).toHaveProperty("error");
      });
    });

    describe("POST /api/auth/login", () => {
      it("should login with valid credentials", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            username: "admin",
            password: "admin123",
          })
          .expect(200);

        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("user");
      });

      it("should return error for invalid credentials", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            username: "admin",
            password: "wrongpassword",
          })
          .expect(401);

        expect(response.body).toHaveProperty("error");
      });
    });
  });
});
