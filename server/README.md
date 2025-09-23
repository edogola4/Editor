# Collaborative Code Editor - Backend

This is the backend service for the Collaborative Code Editor application, built with Node.js, Express, TypeScript, PostgreSQL, and Socket.IO for real-time collaboration.

## ✨ Features

### 🎯 **Core Features**
- **RESTful API** for user management, authentication, and room management
- **Real-time Collaboration** using WebSockets with Socket.IO
- **JWT Authentication** with secure password hashing
- **Database Integration** with PostgreSQL and Sequelize ORM
- **API Documentation** with Swagger/OpenAPI
- **Comprehensive Testing** with Jest and Supertest
- **Code Quality** with ESLint and Prettier
- **Security** with Helmet, CORS, and rate limiting
- **Logging** with Winston and daily rotation

### 🛠 **Technical Features**
- **TypeScript**: Full type safety throughout the application
- **Express.js**: Production-ready web framework
- **Socket.IO**: Real-time bidirectional communication
- **Sequelize ORM**: Database abstraction with migrations
- **bcrypt**: Secure password hashing
- **JWT**: Stateless authentication
- **Winston**: Structured logging
- **Compression**: Response compression
- **Rate Limiting**: API protection
- **CORS**: Cross-origin resource sharing
- **Error Handling**: Custom error middleware

## 🛠 Tech Stack

### **Backend**
- **Node.js 22+** - JavaScript runtime
- **Express.js 4+** - Web application framework
- **TypeScript 5+** - Type-safe backend development
- **Socket.IO 4+** - Real-time WebSocket communication
- **PostgreSQL 14+** - Relational database
- **Sequelize 6+** - ORM with migrations
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **Winston 3+** - Logging with daily rotation
- **node-pg-migrate** - Database migrations

### **Development & Quality**
- **Jest 29+** - Testing framework
- **Supertest** - API testing utilities
- **ESLint 8+** - Code linting
- **Prettier 3+** - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting
- **Nodemon** - Development server with hot reload

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (preferably 22+)
- **PostgreSQL 14+**
- **npm 9+** or **yarn 1.22+**
- **Git**

### Installation & Setup

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
