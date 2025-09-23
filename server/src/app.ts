import "module-alias/register";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authenticate } from "./middleware/auth.js";
import config from "./config/config.js";
import { logger, httpLogger } from "./utils/logger.js";
import { sequelize } from "./config/database.js";
import { redisService } from "./services/redis.js";

// Initialize swagger documentation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(
  path.join(__dirname, "../../docs/swagger.yaml"),
);

/**
 * Express application configuration class
 */
export class App {
  public app: Application;
  private port: number;

  constructor(port: number = config.port) {
    this.app = express();
    this.port = port;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize all middleware
   */
  private initializeMiddleware(): void {
    // Request logging
    this.app.use(httpLogger);

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      }),
    );

    // Trust first proxy (for rate limiting behind reverse proxy)
    this.app.set("trust proxy", 1);

    // CORS configuration
    this.app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = [
            config.cors.origin,
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8080",
          ];

          // Allow requests with no origin (mobile apps, curl, etc.)
          if (!origin) return callback(null, true);

          if (
            allowedOrigins.indexOf(origin) !== -1 ||
            process.env.NODE_ENV === "development"
          ) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
          "Origin",
          "X-Requested-With",
          "Content-Type",
          "Accept",
          "Authorization",
          "Cache-Control",
          "X-File-Name",
        ],
      }),
    );

    // Rate limiting
    this.app.use(
      "/api/",
      rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        message: {
          error: "Too many requests",
          message: "Too many requests from this IP, please try again later.",
          retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next, options) => {
          logger.warn("Rate limit exceeded", {
            ip: req.ip,
            url: req.url,
            userAgent: req.get("User-Agent"),
          });
          res.status(options.statusCode).json(options.message);
        },
      }),
    );

    // Compression middleware
    this.app.use(
      compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers["x-no-compression"]) {
            return false;
          }
          return compression.filter(req, res);
        },
      }),
    );

    // Body parsing middleware
    this.app.use(
      express.json({
        limit: "10mb",
        type: "application/json",
      }),
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
      }),
    );

    // Cookie parser
    this.app.use(cookieParser());

    // Request logging
    this.app.use((req, res, next) => {
      logger.info("Incoming request", {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      });
      next();
    });

    // Health check endpoint
    this.app.get("/health", async (req: Request, res: Response) => {
      try {
        // Check database connection
        await sequelize.authenticate();

        // Check Redis connection
        const redisStatus = await redisService.ping();

        res.status(200).json({
          status: "ok",
          database: "connected",
          redis: redisStatus ? "connected" : "disconnected",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        });
      } catch (error) {
        logger.error("Health check failed", { error });
        res.status(503).json({
          status: "error",
          message: "Service Unavailable",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    });

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Collaborative Code Editor Backend API",
        version: process.env.npm_package_version || "1.0.0",
        endpoints: {
          health: "/health",
          api: "/api",
        },
        documentation: "/api/docs",
      });
    });
  }

  /**
   * Initialize application routes
   */
  private initializeRoutes(): void {
    // API routes will be mounted here
    // Example: this.app.use('/api/auth', authRoutes);
    // Example: this.app.use('/api/rooms', roomRoutes);
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // 404 handler - must be before error handler
    this.app.use(notFoundHandler);

    // Global error handler - must be last
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      this.app.listen(this.port, () => {
        logger.info("Server started successfully", {
          port: this.port,
          environment: config.env,
          corsOrigin: config.cors.origin,
          rateLimit: `${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 1000}s`,
        });
      });
    } catch (error) {
      logger.error("Failed to start server", { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Get the Express application instance
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Add a new route to the application
   */
  public addRoute(path: string, router: any): void {
    this.app.use(path, router);
  }
}

export default App;
