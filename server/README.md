# Collaborative Code Editor - Backend

<div align="center">
  <h2>🚀 Real-time Collaborative Code Editor - Backend</h2>
  <p>High-performance backend service for real-time collaborative code editing</p>

  ![Node.js](https://img.shields.io/badge/Node.js-22+-339933.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178c6.svg)
  ![Express](https://img.shields.io/badge/Express-5+-000000.svg)
  ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101.svg)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)
  ![Redis](https://img.shields.io/badge/Redis-7+-DC382D.svg)
  
  [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
</div>

This is the backend service for the Collaborative Code Editor application, built with Node.js, Express, TypeScript, PostgreSQL, and Socket.IO for real-time collaboration.

## ✨ Features

### 🎯 **Core Features**
- **RESTful API** - User management, authentication, and room management
- **Real-time Collaboration** - WebSockets with Socket.IO for live editing
- **JWT Authentication** - Secure stateless authentication with refresh tokens
- **Database Integration** - PostgreSQL with Sequelize ORM
- **API Documentation** - Comprehensive OpenAPI/Swagger documentation
- **Comprehensive Testing** - Unit, integration, and E2E tests with Jest
- **Code Quality** - ESLint, Prettier, and TypeScript for robust code
- **Security** - Helmet, CORS, rate limiting, and request validation
- **Logging** - Structured logging with Winston and daily rotation
- **Containerization** - Docker support for easy deployment

### 🛠 **Technical Features**
- **TypeScript 5.3+** - Full type safety throughout the application
- **Express.js 4.18+** - Fast, unopinionated web framework
- **Socket.IO 4.7+** - Real-time bidirectional communication
- **Sequelize 7+** - Modern TypeScript-first ORM with migrations
- **PostgreSQL 16+** - Powerful open-source relational database
- **Redis 7+** - In-memory data store for caching and pub/sub
- **JWT** - Secure stateless authentication
- **bcryptjs** - Secure password hashing
- **Winston 3+** - Structured logging with daily rotation
- **Zod** - TypeScript-first schema validation
- **CORS** - Secure cross-origin resource sharing
- **Helmet** - Security headers
- **Rate Limiting** - Protection against brute force attacks
- **Compression** - Response compression for better performance
- **Request Validation** - Input validation middleware

## 🛠 Tech Stack

### **Backend**
- **Node.js 22+** - JavaScript runtime
- **Express.js 4.18+** - Web application framework
- **TypeScript 5.3+** - Type-safe backend development
- **Socket.IO 4.7+ with Redis Adapter** - Scalable WebSocket communication
- **PostgreSQL 16+** - Relational database
- **Redis 7+** - In-memory data structure store and pub/sub
- **Sequelize 7+** - Modern TypeScript ORM with migrations
- **JWT** - Stateless authentication with refresh tokens
- **bcryptjs** - Secure password hashing
- **Winston 3+** - Logging with daily rotation and structured format
- **node-pg-migrate** - Database migrations with version control
- **Zod** - TypeScript-first schema validation
- **CORS** - Secure Cross-Origin Resource Sharing
- **Helmet** - Security headers
- **Express Rate Limit with Redis** - Distributed rate limiting
- **Compression** - Response compression for performance
- **Dotenv** - Environment variable management
- **Redis Commands** - For distributed locking and pub/sub
- **Socket.IO Middleware** - For authentication and validation

### **Development & Quality**
- **Jest 29+** - Testing framework with code coverage
- **Supertest** - HTTP assertions for API testing
- **ESLint 8+** - Code linting with TypeScript support
- **Prettier 3+** - Opinionated code formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Husky** - Git hooks for pre-commit and pre-push
- **Lint-staged** - Run linters on git staged files
- **Docker** - Containerization for consistent environments
- **Docker Compose** - Multi-container orchestration
- **Nodemon** - Development server with hot reload
- **Debug Module** - Namespaced debugging
- **ESLint Import Sorter** - Consistent import ordering
- **Jest Watch** - Interactive test watching
- **Test Containers** - Integration testing with real services

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (preferably 22+)
- **PostgreSQL 16+**
- **Redis 7+**
- **npm 9+** or **yarn 1.22+**
- **Git**

### 🛠 Database & Admin Setup

1. **Initialize the database**:
   ```bash
   # Install dependencies
   npm install
   
   # Copy and configure environment variables
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Run database migrations
   npm run db:migrate
   
   # Seed initial data (including admin user)
   npm run db:seed
   ```

2. **Default Admin Credentials**:
   - **Email**: admin@example.com
   - **Password**: admin123

   > **Security Note**: Change the default admin password immediately after first login.

## 🔧 Database Management

### Admin User Management

#### Create Admin User
```bash
node scripts/create-admin.js --email admin@example.com --password your_secure_password
```

#### Reset Admin Password
```bash
node scripts/update-admin-password.js --email admin@example.com --new-password new_secure_password
```

### Database Operations

#### Run Migrations
```bash
npm run db:migrate
```

#### Rollback Migrations
```bash
npm run db:migrate:undo
```

#### Run Seeds
```bash
npm run db:seed
```

#### Reset Database
```bash
# Drops all tables and runs migrations and seeds
npm run db:reset
```

### Development Commands

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL** (if not already running)
   ```bash
   # On macOS with Homebrew
   brew services start postgresql@14

   # On Ubuntu/Debian
   sudo systemctl start postgresql

   # On Windows
   # Start PostgreSQL service manually
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database** (optional - creates demo admin user)
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   # Server runs on http://localhost:5000
   ```

## 📱 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (Protected)

### **Health & Documentation**
- `GET /health` - Health check
- `GET /` - API documentation (Swagger UI)

### **WebSocket Events**
- `connection` - User connects
- `disconnect` - User disconnects
- `document:join` - Join a document room
- `code-change` - Code content changes
- `language-change` - Programming language changes
- `cursor-update` - Cursor position updates

## 🧪 Testing

### **Available Commands**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run database connection test
npm run test:db
```

### **Test Structure**
- **API Tests**: HTTP endpoint testing with Supertest
- **Model Tests**: Database model validation and methods
- **Utility Tests**: Helper functions and error handling
- **Integration Tests**: Full workflow testing

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm start               # Start production server

# Database
npm run db:migrate      # Run database migrations
npm run db:rollback     # Rollback migrations
npm run db:seed         # Seed database with demo data
npm run db:seed:undo    # Remove seeded data
npm run test:db         # Test database connection

# Code Quality
npm run lint            # Check code quality
npm run lint:fix        # Auto-fix linting issues
npm test                # Run tests
npm run test:coverage   # Generate coverage report
```

## 📂 Project Structure

```
server/
├── src/
│   ├── config/              # Configuration files
│   │   ├── config.ts        # App configuration
│   │   └── database.ts      # Database setup
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # Authentication middleware
│   │   └── errorHandler.ts  # Error handling
│   ├── models/              # Sequelize models
│   │   ├── User.ts          # User model
│   │   ├── Room.ts          # Room model
│   │   ├── Session.ts       # Session model
│   │   └── index.ts         # Model exports
│   ├── services/            # Business logic
│   │   └── redis.ts         # Redis service
│   ├── utils/               # Utility functions
│   │   ├── errors.ts        # Custom error classes
│   │   └── logger.ts        # Logging utilities
│   └── index.ts             # Application entry point
├── db/
│   ├── migrations/          # Database migrations
│   └── seeders/             # Database seeders
├── scripts/                 # Utility scripts
├── dist/                    # Compiled JavaScript
├── tests/                   # Test files
└── package.json             # Dependencies and scripts
```

## 🔧 Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collab_editor
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🐳 Docker Deployment

### Development Environment
```bash
docker-compose -f ../docker-compose.dev.yml up --build
```

### Production Environment
```bash
docker-compose -f ../docker-compose.prod.yml up --build -d
```

## 🚀 Production Deployment

### Prerequisites
- Docker and Docker Compose
- PostgreSQL database
- Domain name (optional)

### Steps

1. **Environment Setup**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production values
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Run Migrations**
   ```bash
   NODE_ENV=production npm run db:migrate
   ```

4. **Start Server**
   ```bash
   NODE_ENV=production npm start
   ```

Or using Docker:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS Protection**: Configured origins
- **Rate Limiting**: API request throttling
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Express-validator
- **Error Sanitization**: Safe error responses

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with daily rotation
- **Health Checks**: `/health` endpoint for monitoring
- **Request Logging**: Morgan middleware
- **Error Tracking**: Comprehensive error handling
- **Performance Monitoring**: Built-in performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow TypeScript best practices
- Use ESLint and Prettier formatting
- Document API endpoints
- Update README for significant changes

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **Express.js** - For the robust web framework
- **Sequelize** - For the excellent ORM capabilities
- **Socket.IO** - For real-time communication
- **PostgreSQL** - For reliable data storage
- **Winston** - For comprehensive logging
- **Jest** - For testing framework
- **TypeScript** - For type safety

---

<div align="center">
  <p>Built with ❤️ for seamless collaborative coding</p>
  <p><strong>Powering real-time development experiences 🚀</strong></p>
</div>
