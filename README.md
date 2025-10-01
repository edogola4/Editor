# Collaborative Code Editor

<div align="center">
  <h1>🚀 Real-time Collaborative Code Editor</h1>
  <p><strong>Professional VS Code-like collaborative coding experience with real-time collaboration</strong></p>

  ![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
  ![React](https://img.shields.io/badge/React-19-61dafb.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178c6.svg)
  ![Node.js](https://img.shields.io/badge/Node.js-22+-339933.svg)
  ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101.svg)
  ![Monaco Editor](https://img.shields.io/badge/Monaco-0.53.0-007acc.svg)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)
  ![Redis](https://img.shields.io/badge/Redis-7+-DC382D.svg)
  ![ESM](https://img.shields.io/badge/ES_Modules-100%25-FFCA28.svg)

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/edogola4/Editor/pulls)
  [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
</div>

## ✨ Features

### 🎯 **Core Features**
- **Real-time Collaboration**: Multi-user editing with operational transformation
- **VS Code Experience**: Full Monaco Editor integration with IntelliSense
- **Live Cursor Sharing**: See other users' cursors and selections in real-time
- **User Presence**: Visual indicators showing connected users and their activity
- **Multi-language Support**: 50+ programming languages with syntax highlighting
- **GitHub Integration**: Sign in with GitHub and import repositories
- **Session Management**: Save and load collaborative sessions
- **File Management**: Upload, create, and organize files and folders
- **Redis-based Pub/Sub**: Scalable real-time messaging with Redis adapter
- **Rate Limiting**: Protect your server from abuse with configurable rate limits
- **Comprehensive Monitoring**: Built-in monitoring for system health and performance
- **Operational Transformation**: Custom OT algorithm implementation for conflict resolution
- **TypeScript First**: Full type safety across the entire stack with latest TS features

### 🛠 **Editor Features**
- **Monaco Editor**: Full VS Code editing experience
- **IntelliSense**: Smart code completion and hover information
- **Multi-cursor Support**: Multiple cursors for efficient editing
- **Themes**: Built-in light and dark themes with VS Code compatibility
- **Keybindings**: VS Code keybindings out of the box
- **Minimap**: Code overview for easy navigation
- **Bracket Pair Colorization**: Visual matching of brackets
- **Word Wrap**: Configurable text wrapping
- **Auto-Formatting**: Automatic code formatting on save

### 🎨 **User Interface**
- **Modern Design**: Clean, professional interface inspired by VS Code
- **Responsive Layout**: Works perfectly on desktop and tablet devices
- **User Avatars**: Color-coded user identification system
- **Status Indicators**: Real-time connection and activity status
- **Customizable UI**: Tailwind CSS with custom theme colors
- **Dark/Light Mode**: Toggle between themes for comfortable coding

### 🔧 **Technical Features**
- **TypeScript First**: Full type safety across the entire stack with TS 5.8+
- **Modular Architecture**: Clean separation of concerns with service layers
- **WebSockets**: Real-time bidirectional communication with Socket.IO 4.8+
- **JWT Authentication**: Secure stateless authentication with refresh tokens
- **Database Migrations**: Version-controlled database schema changes with Sequelize
- **Containerized**: Easy deployment with Docker and Docker Compose
- **Modern State Management**: Zustand + Immer for predictable state updates
- **Real-time Sync**: Custom Operational Transformation algorithm with Socket.IO
- **Monorepo Architecture**: Shared code between client and server with proper separation
- **ES Modules**: Native ESM support throughout the application
- **Optimized Builds**: Vite for fast development and production builds
- **Comprehensive Testing**: Unit, integration, and E2E tests with Vitest and Jest
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode enabled

## 🛠 Tech Stack

### **Frontend**
- **React 19+** - Modern React with latest features
- **TypeScript 5.8+** - Full type safety and developer experience
- **Vite 5+** - Lightning-fast build tool and dev server
- **Tailwind CSS 4+** - Utility-first CSS framework with custom theme
- **Monaco Editor 0.53+** - VS Code's editor component
- **Socket.IO Client 4.8+** - Real-time communication
- **Zustand 5+** - Lightweight state management
- **Immer 10+** - Immutable state updates
- **React Query 5+** - Server state management
- **React Hook Form 7+** - Form handling
- **Axios 1.7+** - HTTP client
- **React Hot Toast 2.4+** - Toast notifications
- **React Icons 5.0+** - Icon library
- **React Router DOM 7+** - Client-side routing

### **Backend**
- **Node.js 22+** - Latest LTS with ESM support
- **Express.js 5+** - Modern web framework with async/await
- **TypeScript 5.8+** - Type-safe backend with strict mode
- **Socket.IO 4.8.1** - Real-time WebSocket communication
- **PostgreSQL 16+** - Advanced relational database
- **Redis 7+** - Caching, pub/sub, and rate limiting
- **JWT** - Stateless authentication
- **Sequelize 7+** - Type-safe ORM with migrations
- **Winston 3.11+** - Structured logging
- **bcryptjs 2.4+** - Password hashing
- **Zod 3.22+** - TypeScript-first schema validation
- **CORS 2.8+** - Cross-origin resource sharing
- **Helmet 7.1+** - Security headers
- **Express Rate Limit 7.1+** - Rate limiting middleware
- **Compression 1.7+** - Response compression

### **Development & Deployment**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancing
- **ESLint** - Code linting and formatting

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+** (LTS recommended)
- **PostgreSQL 16+**
- **Redis 7+**
- **npm 10+** or **yarn 1.22+**
- **Git**

### Database Setup

1. **Initialize the database and create admin user**:
   ```bash
   # Run database migrations and create admin user
   # Copy and configure environment files
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local

   # Install dependencies
   pnpm install
   cd server && pnpm install
   cd ../client && pnpm install
   cd ..
   ```

3. **Database setup**
   ```bash
   # Start PostgreSQL and Redis (requires Docker)
   docker-compose up -d postgres redis

   # Run database migrations
   cd server
   pnpm db:migrate
   ```

4. **Start development servers**
   ```bash
   # In separate terminal windows:
   pnpm dev:server  # Start backend server
   pnpm dev:client  # Start frontend dev server
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - API Server: http://localhost:5000
   - Database: localhost:5432 (postgres/collaborative_editor)
   - Redis: localhost:6379

### Development Scripts

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev           # Start both client and server
pnpm dev:client    # Start frontend only
pnpm dev:server    # Start backend only

# Build for production
pnpm build
pnpm build:client
pnpm build:server

# Run tests
pnpm test
pnpm test:client
pnpm test:server

# Run linter
pnpm lint

# Run type checking
pnpm typecheck
```

## 🔑 API Authentication

### Login & Token Management

1. **Login to get JWT tokens:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user1@example.com", "password": "User123!@#"}'
   ```

2. **Use the access token for authenticated requests:**
   ```bash
   curl http://localhost:5000/api/users \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. **When token expires (after 15 minutes), login again for a fresh token**

### Demo Credentials

For testing the application, use these demo credentials:

```javascript
Email: user1@example.com
Password: User123!@#
Role: admin (after promotion)
```

Or register a new account directly in the application.

## 📚 API Endpoints

### Public Endpoints
- `GET /` - API documentation and info
- `GET /api` - API v1 root endpoint
- `GET /api/health` - Server health check
- `GET /api/rooms` - List public rooms
- `GET /api/rooms/:id` - Get specific room (public rooms only)

### Authentication Required
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token

### Admin Only (JWT + Admin Role Required)
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get specific user (admin only)

### User Profile (JWT Required)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user account

### Development Routes (Dev Only)
- `GET /api/dev/users` - List all users (no auth required)
- `POST /api/dev/promote-to-admin` - Promote user to admin (auth required)
- `POST /api/dev/promote-user-to-admin` - Promote user by email (no auth required)
- `POST /api/dev/reset-database` - Reset database (dev only)

## 🧪 Testing Real-time Collaboration

### Quick Test
1. **Open Multiple Browser Tabs** with `http://localhost:5173`
2. **Verify Collaboration**: All tabs should show:
   - Same document ID: "shared_collaboration_session"
   - "🔗 Shared Session - All tabs collaborate here!"
   - Increasing user count as tabs open

3. **Test Features**:
   - **Code Sync**: Type in one tab → See instantly in others
   - **Cursors**: Move cursor in one tab → See colored cursor in others
   - **Users**: Watch user avatars appear as tabs connect
   - **Typing**: Type in any tab → See "tab_xxx typing..." in others

### Debug Information
- **Browser Console**: Press F12 → Console for WebSocket logs
- **Server Logs**: Check terminal for connection events
- **Test Script**: Run `./collaboration-test.sh` for comprehensive testing

## 📂 Project Structure

```
collaborative-code-editor/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── CodeEditor.tsx   # Main Monaco editor component
│   │   │   ├── UserPresence.tsx # User presence indicators
│   │   │   └── StatusBar.tsx    # Status bar with connection info
│   ├── store/                   # State management
│   │   │   ├── authStore.ts     # Authentication state
│   │   │   └── editorStore.ts   # Editor state with collaboration
│   ├── utils/                   # Utility functions
│   │   │   ├── api.ts           # HTTP API client
│   │   │   └── socket.ts        # WebSocket connection manager
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── server/                      # Backend Node.js application
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── config.ts        # Application configuration
│   │   │   └── database.ts      # Database configuration
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # Authentication middleware
│   │   │   └── errorHandler.ts  # Error handling middleware
│   │   ├── models/              # Database models
│   │   │   ├── User.ts          # User model
│   │   │   ├── Room.ts          # Room model
│   │   │   ├── Document.ts      # Document model
│   │   │   └── index.ts         # Model associations
│   │   ├── services/            # Business logic services
│   │   │   └── redis.ts         # Redis service for caching
│   │   ├── utils/               # Utility functions
│   │   │   ├── errors.ts        # Custom error classes
│   │   │   └── logger.ts        # Winston logger configuration
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.routes.ts  # Authentication routes
│   │   │   ├── user.routes.ts  # User management routes
│   │   │   ├── room.routes.ts  # Room management routes
│   │   │   └── dev.routes.ts   # Development-only routes
│   │   ├── controllers/        # Request handlers
│   │   │   ├── auth.controller.ts  # Auth logic
│   │   │   ├── user.controller.ts  # User logic
│   │   │   └── room.controller.ts  # Room logic
│   │   ├── app.ts               # Express application setup
│   │   ├── index.ts             # Server entry point
│   │   └── __tests__/           # Test files
│   ├── db/                      # Database files
│   │   ├── config.json          # Sequelize configuration
│   │   ├── migrations/          # Database migrations
│   │   └── seeders/             # Database seeders
│   ├── scripts/                 # Utility scripts
│   │   ├── load-env.js         # Environment loading
│   │   └── test-db.ts          # Database testing
│   ├── package.json            # Dependencies and scripts
│   ├── tsconfig.json           # TypeScript configuration
│   ├── jest.config.mjs         # Jest configuration
│   ├── eslint.config.js        # ESLint configuration
│   └── .sequelizerc            # Sequelize CLI configuration
├── test-collaboration.sh       # Collaboration testing script
├── debug-guide.sh              # Debugging guide script
├── collaboration-test.sh       # Comprehensive testing guide
├── .gitignore                  # Git ignore rules
├── README.md                   # Main project documentation
└── LICENSE                     # Project license
```

## 🔧 Environment Variables

### Server Environment (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collaborative_editor
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration (Auto-generated on first run)
JWT_SECRET=your-super-secret-jwt-key-...
JWT_REFRESH_SECRET=your-super-secret-refresh-key-...

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
```

### Client Environment (.env.local)
```env
# Backend API Configuration
VITE_API_URL=http://localhost:5000
VITE_SERVER_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Collaborative Code Editor
VITE_APP_VERSION=1.0.0

# Feature Flags (optional)
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=false
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual services
docker build -t collaborative-editor-client ./client
docker build -t collaborative-editor-server ./server
```

### Manual Deployment
1. **Build frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Configure production environment**
   ```bash
   cd ../server
   # Set production environment variables
   export NODE_ENV=production
   ```

3. **Start production server**
   ```bash
   npm start
   ```

### Deployment Options
- **Static Hosting**: Deploy `client/dist/` to any static host (Netlify, Vercel, etc.)
- **Docker**: Use provided Dockerfiles for containerized deployment
- **Cloud Platforms**: AWS, Google Cloud, Azure, DigitalOcean
- **CDN**: Serve static assets through CDN for better performance

## 🔒 Security Features

- **CORS Protection**: Configured to accept requests from authorized origins
- **Input Validation**: Client-side and server-side validation
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Token-based request validation
- **Secure Headers**: Helmet.js security headers
- **Environment Variables**: Sensitive data in environment files
- **JWT Authentication**: Secure token-based authentication
- **Database Security**: Parameterized queries and connection pooling

## 📊 Performance Optimization

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Bundle Analysis**: Vite's built-in bundle analyzer
- **Caching**: Aggressive caching strategies for static assets
- **Minification**: Automatic CSS and JS minification
- **Compression**: Gzip compression for all responses
- **Database Optimization**: Connection pooling and query optimization

## 🧪 Testing Strategy

### Unit Tests
- Component rendering and behavior
- Utility function logic
- State management actions
- API service functions

### Integration Tests
- User authentication flows
- Real-time collaboration features
- API integration testing
- Database operations

### E2E Tests
- Complete user journeys
- Multi-user collaboration scenarios
- Cross-browser compatibility testing
- Performance testing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Write tests for new components and features
- Follow React and TypeScript best practices
- Use ESLint and Prettier formatting
- Document component APIs
- Keep bundle size in mind
- Test across different browsers and devices

## 📱 Browser Support

- **Chrome 90+** ✅ (Recommended)
- **Firefox 88+** ✅
- **Safari 14+** ✅
- **Edge 90+** ✅
- **Mobile Browsers** ✅ (Responsive design)

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - For the excellent code editing experience
- **React & TypeScript** - For the robust frontend framework
- **Vite** - For the incredibly fast development experience
- **Tailwind CSS** - For the beautiful and responsive UI
- **Socket.IO** - For real-time communication capabilities
- **PostgreSQL & Sequelize** - For reliable data persistence
- **Zustand & Immer** - For lightweight and efficient state management
- **Express.js** - For the solid backend framework
- **JWT** - For secure authentication

---

<div align="center">
  <p>Built with ❤️ for seamless collaborative coding</p>
  <p><strong>Experience the future of collaborative development 🚀</strong></p>
</div>
