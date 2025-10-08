# Collaborative Code Editor

<div align="center">
  <h1>🚀 Real-time Collaborative Code Editor</h1>
  <p><strong>Professional VS Code-like collaborative coding experience with real-time WebSocket synchronization</strong></p>

  ![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)
  ![React](https://img.shields.io/badge/React-19-61dafb.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178c6.svg)
  ![Node.js](https://img.shields.io/badge/Node.js-22+-339933.svg)
  ![WebSocket](https://img.shields.io/badge/WebSocket-100%25-010101.svg)
  ![Monaco Editor](https://img.shields.io/badge/Monaco-0.53.0-007acc.svg)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)
  ![Redis](https://img.shields.io/badge/Redis-7+-DC382D.svg)
  ![Jest](https://img.shields.io/badge/Jest-29.7+-C21325.svg)
  [![Test Coverage](https://img.shields.io/codecov/c/github/edogola4/Editor/main.svg)](https://codecov.io/gh/edogola4/Editor)
  [![CI/CD](https://github.com/edogola4/Editor/actions/workflows/ci.yml/badge.svg)](https://github.com/edogola4/Editor/actions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/edogola4/Editor/pulls)
  [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
  [![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-85EA2D.svg)](https://editor.swagger.io/?url=https://raw.githubusercontent.com/edogola4/Editor/main/docs/api/openapi.yaml)
</div>

## 🌟 What's New in v4.3.0

### 🏗 State Management Overhaul
- **Zustand Integration**: Lightweight, fast state management with minimal boilerplate
- **Type-Safe Stores**: Full TypeScript support with strict type checking
- **Optimistic UI Updates**: Smooth user experience with instant feedback
- **Modular Architecture**: Separated concerns with dedicated stores for editor, room, user, and UI states
- **Redux DevTools Integration**: Powerful debugging with time-travel capabilities
- **Persistence Middleware**: Automatic state persistence across page reloads
- **Performance Optimized**: Memoized selectors and batched updates

### 🛠 Enhanced Features
- **Room Management System**: Comprehensive room-based collaboration with role-based access control
- **Real-time State Sync**: Seamless synchronization across clients with operational transformation
- **Error Boundaries**: Graceful error handling and recovery
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Testing Utilities**: Comprehensive test coverage for state management

## ✨ Features

### 🎯 **Core Features**
- **Room-based Collaboration**: Organize work in dedicated rooms with access controls
- **Role-based Access Control**: Granular permissions (Owner, Admin, Editor, Viewer, Guest)
- **Real-time Editing**: Multi-user editing with operational transformation (OT)
- **WebSocket-based Synchronization**: Low-latency document synchronization using Socket.IO
- **VS Code Experience**: Full Monaco Editor integration with IntelliSense and code completion
- **Live Cursor & Selection**: See other users' cursors and selections in real-time with user-specific colors
- **User Presence & Activity**: Visual indicators showing connected users and their current actions
- **Room Invitations**: Generate and manage invite links with configurable permissions
- **Multi-language Support**: 50+ programming languages with syntax highlighting
- **Document Versioning**: Track changes and revert to previous versions with full history
- **Redis-based State Management**: Scalable document state management with pub/sub
- **Rate Limiting**: Configurable rate limits for API and WebSocket endpoints
- **Operational Transformation**: Custom OT algorithm for conflict resolution
- **TypeScript First**: Full type safety across the entire stack
- **Responsive Design**: Works on desktop and tablet devices

### 🚀 **Performance**
- **Efficient Sync**: Delta synchronization for large documents
- **Operation Batching**: Minimize network traffic with operation batching
- **Debounced Updates**: Optimize cursor and selection updates
- **Scalable Architecture**: Designed to handle thousands of concurrent users
- **Load Tested**: k6 load testing scripts included for performance validation

### 🛡 **Security**
- **JWT Authentication**: Secure token-based authentication
- **WebSocket Security**: Encrypted communication with WSS
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against abuse and DoS attacks
- **CORS Protection**: Strict CORS policies
- **Security Headers**: Helmet.js for secure HTTP headers

### 🛠 **Editor Features**
- **Monaco Editor**: Full VS Code editing experience with extensions support
- **IntelliSense**: Smart code completion, parameter hints, and hover information
- **Multi-cursor Support**: Multiple cursors for efficient editing
- **Themes**: Built-in light, dark, and high-contrast themes with VS Code compatibility
- **Keybindings**: VS Code keybindings with customization options
- **Minimap**: Code overview for easy navigation
- **Bracket Pair Colorization**: Visual matching of brackets and indentation guides
- **Word Wrap**: Configurable text wrapping with word wrap guides
- **Auto-Formatting**: Automatic code formatting on save with Prettier integration
- **Code Folding**: Collapsible code blocks for better navigation
- **Search & Replace**: Advanced search with regex support
- **Snippets**: Built-in code snippets for common patterns
- **Emmet Support**: HTML/CSS abbreviations expansion

### 🎨 **User Interface**
- **Modern Design**: Clean, professional interface inspired by VS Code
- **Room Management**: Intuitive interface for creating, joining, and managing rooms
- **User Roles & Permissions**: Clear visual indicators of user roles and permissions
- **Responsive Layout**: Works perfectly on desktop and tablet devices
- **User Avatars**: Color-coded user identification system with custom avatars
- **Status Indicators**: Real-time connection, typing, and activity status
- **Room Activity Feed**: Track changes and user actions within each room
- **Invite Management**: Easy-to-use interface for generating and managing room invites
- **Customizable UI**: Tailwind CSS with theme customization
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Command Palette**: Quick access to commands with keyboard shortcuts
- **File Explorer**: Tree view for easy navigation of project files
- **Terminal Integration**: Built-in terminal for running commands

### 🔧 **Technical Features**
- **TypeScript First**: Full type safety with TypeScript 5.8+ and strict mode
- **State Management**: Zustand with middleware for persistence, logging, and Redux DevTools
- **Modular Architecture**: Clean separation of concerns with dedicated stores
- **WebSockets**: Real-time bidirectional communication with Socket.IO 4.8+
- **JWT Authentication**: Secure stateless authentication with refresh tokens
- **Optimistic Updates**: Smooth UI experience with automatic rollback on error
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Error Boundaries**: Comprehensive error handling and recovery
- **Testing**: Jest and React Testing Library for unit and integration tests
- **Database Migrations**: Version-controlled schema changes with Sequelize
- **Containerized**: Docker and Docker Compose for consistent environments
- **State Management**: Zustand + Immer for predictable state updates
- **Real-time Sync**: Custom OT algorithm with conflict resolution
- **Monorepo**: Shared code between client and server with proper separation
- **ES Modules**: Native ESM support throughout the application
- **Optimized Builds**: Vite for fast development and production builds
- **Testing**: Unit, integration, and E2E tests with Vitest and Jest
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: New Relic integration for performance insights
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Infrastructure as Code**: Terraform for cloud infrastructure

## 🧠 State Management

Our application uses **Zustand** for state management, providing a lightweight yet powerful solution with excellent TypeScript support. The state is organized into modular stores for better maintainability and performance.

### Key Features

- **Modular Architecture**: Separate stores for editor, room, user, socket, and UI state
- **Type Safety**: Full TypeScript support with strict type checking
- **Optimistic Updates**: Smooth UI experience with automatic rollback on error
- **Redux DevTools**: Time-travel debugging and state inspection
- **Persistence**: Automatic state persistence across page reloads
- **Performance Optimized**: Memoized selectors and batched updates
- **Middleware Support**: Custom middleware for logging, persistence, and more

### Store Structure

```
store/
├── index.ts         # Main store configuration and exports
├── types.ts         # TypeScript types and interfaces
└── middleware/      # Custom middleware
    ├── persist.ts   # State persistence
    ├── logger.ts    # Action logging
    └── devtools.ts  # Redux DevTools integration
```

### Example Usage

```typescript
// Accessing state
const { content, isSaving } = useEditor();
const { currentUser } = useUser();

// Updating state
const { setContent } = useEditorActions();
setContent({ content: 'New content', isDirty: true });

// Using selectors for optimized re-renders
const userName = useUser(state => state.currentUser?.name);
```

For more details, see the [State Management Documentation](./client/src/store/README.md).

## 🛠 Tech Stack

### **Frontend**
- **React 19+** - Modern React with concurrent features
- **TypeScript 5.8+** - Type safety and developer experience
- **Vite 5+** - Next-generation frontend tooling
- **Zustand 5+** - Lightweight state management with hooks
- **Immer 10+** - Immutable state with mutable syntax
- **React Query 5+** - Server state management and caching
- **Tailwind CSS 4+** - Utility-first CSS with JIT compiler
- **Monaco Editor 0.53+** - VS Code's editor component
- **Socket.IO Client 4.8+** - Real-time communication
- **Zustand 5+** - Lightweight state management
- **Immer 10+** - Immutable state updates
- **TanStack Query 5+** - Server state management
- **React Hook Form 7+** - Performant form handling
- **Axios 1.7+** - Promise-based HTTP client
- **React Hot Toast 2.4+** - Beautiful toast notifications
- **React Icons 5.0+** - Popular icon libraries
- **React Router DOM 7+** - Declarative routing
- **Framer Motion** - Animation library
- **Zod** - TypeScript-first schema validation
- **date-fns** - Date utility library
- **Vite PWA** - Progressive Web App support

### **Backend**
- **Node.js 22+** - Latest LTS with ESM support
- **Express.js 5+** - Fast, unopinionated web framework
- **TypeScript 5.8+** - Type-safe backend with strict mode
- **Socket.IO 4.8.1** - Real-time WebSocket communication
- **PostgreSQL 16+** - Advanced relational database
- **Redis 7+** - Caching, pub/sub, and rate limiting
- **Sequelize 7+** - Modern TypeScript ORM
- **JWT** - Stateless authentication with refresh tokens
- **Winston** - Logging with daily rotation
- **Zod** - TypeScript-first schema validation
- **Node-cron** - Job scheduling
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Security headers
- **Compression** - Response compression
- **Rate Limit** - Request rate limiting
- **Swagger UI** - API documentation
- **Jest** - Testing framework
- **Supertest** - HTTP assertions
- **ESLint & Prettier** - Code quality
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
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+** (LTS recommended)
- **Docker** and **Docker Compose** (for containerized development)
- **PostgreSQL 16+** (with PostGIS extension)
- **Redis 7+** (for real-time features and caching)
- **pnpm 8+** (recommended package manager)
- **Git**

### Development Setup

#### With Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/edogola4/Editor.git
cd Editor

# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec server pnpm db:migrate

# Access the application at http://localhost:3000
```

#### Manual Setup
```bash
# Install dependencies
pnpm install
cd server && pnpm install
cd ../client && pnpm install
cd ..

# Start services
docker-compose up -d postgres redis

# Run migrations
cd server
pnpm db:migrate

# Start development servers
pnpm dev:server  # In one terminal
pnpm dev:client  # In another terminal
```

## 🚀 Quick Start

### Prerequisites

- Node.js v22 or higher
- PostgreSQL 16+
- Redis 7+
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/edogola4/Editor.git
   cd Editor
   ```

2. **Set up environment variables**
   ```bash
   # Copy the example .env file
   cp .env.example .env
   
   # Edit the .env file with your configuration
   # You'll need to set up database credentials, JWT secrets, etc.
   ```

3. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

4. **Set up the database**
   ```bash
   # Run database migrations
   cd server
   npx sequelize-cli db:migrate
   
   # (Optional) Seed the database with test data
   npx sequelize-cli db:seed:all
   ```

5. **Start the development servers**
   ```bash
   # In the root directory, start both client and server
   npm run dev
   ```

   This will start:
   - Frontend on http://localhost:5173
   - Backend API on http://localhost:5000
   - WebSocket server on ws://localhost:5000

6. **Access the application**
   Open your browser and navigate to http://localhost:5173

2. **Set up environment variables**
   ```bash
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
