# Collaborative Code Editor - Backend

<div align="center">
  <h2>🚀 Real-time Collaborative Code Editor - Backend</h2>
  <p>High-performance backend service for real-time collaborative code editing with operational transformation</p>

  ![Node.js](https://img.shields.io/badge/Node.js-22+-339933.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178c6.svg)
  ![Express](https://img.shields.io/badge/Express-5+-000000.svg)
  ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101.svg)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)
  ![Redis](https://img.shields.io/badge/Redis-7+-DC382D.svg)
  ![Docker](https://img.shields.io/badge/Docker-3.8+-2496ED.svg)
  ![Vitest](https://img.shields.io/badge/Vitest-1.0.0-6E56F7.svg)
  
  [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
  [![Test Coverage](https://api.codeclimate.com/v1/badges/backend_coverage.svg)](https://codeclimate.com/github/edogola4/Editor/coverage)
  [![Dependencies](https://img.shields.io/david/edogola4/Editor?path=server)](https://david-dm.org/edogola4/Editor?path=server)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/edogola4/Editor/pulls)
</div>

This is the backend service for the Collaborative Code Editor application, built with modern technologies to provide a scalable and performant real-time collaboration experience. The backend features operational transformation for conflict-free collaborative editing, real-time synchronization, and a robust authentication system.

The system is designed with a modular architecture, clean separation of concerns, and comprehensive testing to ensure reliability and maintainability. It supports multiple concurrent users, document versioning, and provides real-time presence indicators and cursor tracking.

## ✨ Features

### 🎯 **Core Features**
- **Real-time Collaboration** - WebSockets with Socket.IO for live editing with operational transformation
- **JWT Authentication** - Secure stateless authentication with refresh tokens and role-based access control
- **RESTful API** - Comprehensive API for user management, authentication, and document handling
- **Document Versioning** - Track changes and revert to previous versions with full history
- **User Presence** - Real-time presence indicators and cursor tracking

### 🔒 **Security**
- **Password Security** - Strong password policies with bcrypt hashing and complexity requirements
- **Rate Limiting** - Configurable rate limiting for API and WebSocket endpoints
- **Input Validation** - Comprehensive request validation using Zod schemas
- **Security Headers** - Helmet middleware for secure HTTP headers
- **CORS Protection** - Configurable CORS policies
- **CSRF Protection** - Built-in CSRF protection
- **Request Validation** - Request body, query, and parameter validation
- **Session Management** - Secure session handling with Redis

### 🛠 **Technical Features**
- **TypeScript 5.8+** - Full type safety with strict mode enabled
- **Express.js 5.1+** - Fast, unopinionated web framework with async/await
- **Socket.IO 4.8.1+** - Real-time bidirectional communication with Redis adapter
- **PostgreSQL 16+** - Robust relational database with Sequelize ORM
- **Redis 7+** - In-memory data store for caching and pub/sub
- **Docker & Docker Compose** - Containerization for consistent environments
- **Testing** - Comprehensive test suite with Vitest and Jest
- **Code Quality** - ESLint, Prettier, and TypeScript with strict mode
- **Structured Logging** - JSON-formatted logs with Winston and daily rotation
- **API Documentation** - Auto-generated OpenAPI/Swagger documentation
- **Health Checks** - Endpoints for monitoring application health
- **Error Tracking** - Integration with error monitoring services
- **Background Jobs** - Support for scheduled and queued tasks

### 🚀 **Getting Started**

#### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

#### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/edogola4/Editor.git
   cd Editor/server
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Update the .env file with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

#### Running with Docker

```bash
docker-compose up -d
```

### 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

### 🛠 Development

- Lint code:
  ```bash
  npm run lint
  ```

- Format code:
  ```bash
  npm run format
  ```

- Generate API documentation:
  ```bash
  npm run docs
  ```

### 📦 Production Build

```bash
npm run build
npm start
```
- **Sequelize 7.1.0+** - Modern TypeScript ORM with migrations and associations
- **PostgreSQL 16+** - Advanced relational database with JSONB support
- **Redis 7.2+** - In-memory data store for caching, pub/sub, and distributed locking
- **JWT** - Stateless authentication with refresh tokens
- **bcryptjs** - Secure password hashing with configurable salt rounds
- **Winston 3.11+** - Structured logging with daily rotation and multiple transports
- **Zod 3.22+** - TypeScript-first schema validation with runtime type safety
- **CORS** - Configurable cross-origin resource sharing
- **Helmet 7.1+** - Security headers for Express
- **Express Rate Limit 7.1+** - Flexible rate limiting middleware
- **Compression** - Response compression with multiple algorithms
- **Request Validation** - Comprehensive input validation with Zod
- **Dependency Injection** - InversifyJS for dependency injection
- **Event Sourcing** - Event-driven architecture for complex workflows
- **Distributed Tracing** - Request tracing across services
- **API Versioning** - Support for multiple API versions
- **WebSocket Middleware** - Authentication and validation for WebSocket connections

## 🛠 Tech Stack

### **Runtime & Framework**
- **Node.js 22+** - JavaScript runtime with ESM support
- **Express.js 5.1+** - Fast, unopinionated web framework
- **TypeScript 5.8+** - Type-safe development with strict mode
- **InversifyJS** - Dependency injection container
- **ts-node** - TypeScript execution and REPL
- **tsconfig-paths** - Module path aliases

### **API & Real-time**
- **Socket.IO 4.8.1+** - Real-time bidirectional communication
- **Redis Adapter** - Scalable WebSocket communication
- **Swagger UI Express** - Interactive API documentation
- **OpenAPI 3.0** - API specification
- **JWT** - Stateless authentication
- **Passport.js** - Authentication middleware
- **Express Validator** - Request validation
- **CORS** - Cross-Origin Resource Sharing
- **Compression** - Response compression
- **Helmet** - Security headers
- **Express Rate Limit** - Request rate limiting
- **Morgan** - HTTP request logger
- **Multer** - File upload handling
- **Formidable** - Multipart form parsing
- **Cookie Parser** - HTTP cookie parsing
- **CSURF** - CSRF protection
- **Express Session** - Session management

### **Database & ORM**
- **PostgreSQL 16+** - Advanced relational database
- **Sequelize 7.1.0+** - TypeScript ORM with migrations
- **Sequelize CLI** - Database migration and seeding
- **pg** - PostgreSQL client
- **pg-hstore** - PostgreSQL hstore support
- **Redis 7.2+** - In-memory data store
- **ioredis** - Redis client
- **TypeORM** - Alternative ORM (optional)
- **MongoDB** - NoSQL database (optional)
- **Mongoose** - MongoDB ODM (optional)

### **Authentication & Security**
- **JWT** - JSON Web Tokens
- **bcryptjs** - Password hashing
- **Passport** - Authentication middleware
- **OAuth2** - OAuth 2.0 authentication
- **OpenID Connect** - Identity layer
- **Argon2** - Password hashing (alternative to bcrypt)
- **Joi** - Schema validation
- **Zod** - TypeScript-first validation
- **Validator.js** - String validation
- **Rate Limiter** - Request rate limiting
- **CSRF** - CSRF protection
- **Helmet** - Security headers
- **Express Mung** - Response transformation
- **Express Status Monitor** - Real-time server monitoring

### **Logging & Monitoring**
- **Winston 3.11+** - Logging library
- **Morgan** - HTTP request logger
- **New Relic** - Application monitoring
- **Sentry** - Error tracking
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring and observability
- **PM2** - Process manager
- **Nodemon** - Development server
- **Debug** - Debugging utility
- **Pino** - JSON logger
- **Bunyan** - JSON logger

### **Testing**
- **Vitest 1.0.0+** - Next generation testing framework (primary test runner)
- **Jest 29.7+** - Testing framework (legacy, being migrated to Vitest)
- **Supertest** - HTTP assertions
- **Test Containers** - Integration testing
- **Faker** - Fake data generation
- **ioredis-mock** - In-memory Redis for testing
- **Nock** - HTTP server mocking
- **Sinon** - Test spies, stubs and mocks
- **@vitest/coverage-v8** - Code coverage with V8
- **@vitest/ui** - Beautiful UI for test running
- **@vitest/snapshot** - Snapshot testing
- **Jest Fetch Mock** - Fetch mocking
- **Jest Image Snapshot** - Visual regression testing
- **Jest JUnit** - JUnit test reporting
- **Jest Styled Components** - Styled Components testing
- **Jest Watch** - Interactive test watching
- **MSW** - API mocking
- **React Testing Library** - React component testing

### **Development Tools**
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Lint Staged** - Run linters on git staged files
- **Commitizen** - Conventional commit messages
- **Commitlint** - Lint commit messages
- **Standard Version** - Automated versioning
- **TypeDoc** - Documentation generator
- **TS-Node** - TypeScript execution
- **TS-Config-Paths** - Module aliases
- **Nodemon** - Development server
- **Concurrently** - Run multiple commands
- **Cross-Env** - Cross-platform environment variables
- **Rimraf** - Cross-platform file deletion
- **Chalk** - Terminal string styling
- **Inquirer** - Interactive command-line prompts
- **Listr** - Terminal task list
- **Ora** - Elegant terminal spinner
- **Signale** - Beautiful console logger
- **Update Notifier** - Update notifications
- **Yargs** - Command-line argument parsing

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

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/__tests__/basic.test.ts

# Debug tests
# Add `debugger` statements in your test files, then run:
npm run test:debug
```

### Test Structure
- Unit tests: `src/__tests__/*.test.ts`
- Integration tests: `src/__tests__/integration/`
- E2E tests: `src/__tests__/e2e/`

### Test Configuration

Tests are configured in `vite.config.ts` with the following settings:

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/test/**',
        '**/tests/**',
      ],
    },
  },
  // ...
});
```

### Prerequisites
- **Node.js 22+** (LTS)
- **PostgreSQL 16+**
- **Redis 7+**
- **Docker 24+** (optional)
- **npm 9+** or **yarn 1.22+**
- **Git**

### Environment Variables
Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=code_editor
DB_USER=postgres
DB_PASSWORD=postgres
DB_LOGGING=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Other
SENTRY_DSN=
NEW_RELIC_LICENSE_KEY=
```

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   
   # Generate secure secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Use the output for JWT_SECRET and JWT_REFRESH_SECRET
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

## 🔒 Security Features

### **Authentication & Authorization**
- **JWT Authentication** - Stateless tokens with short expiration
- **Refresh Tokens** - Secure token rotation mechanism
- **Role-based Access Control** - Fine-grained permission system
- **Password Policies** - Enforced complexity requirements
- **Account Lockout** - Protection against brute force attacks
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
