# Collaborative Code Editor - Frontend

<div align="center">
  <h2>🚀 Real-time Collaborative Editor</h2>
  <p>Professional VS Code-like collaborative coding experience with WebSocket synchronization</p>

  ![React](https://img.shields.io/badge/React-19-61dafb.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178c6.svg)
  ![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-06B6D4.svg)
  ![Monaco Editor](https://img.shields.io/badge/Monaco-0.53.0-007acc.svg)
  ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101.svg)
  ![Jest](https://img.shields.io/badge/Jest-29.7+-C21325.svg)
  [![Test Coverage](https://img.shields.io/codecov/c/github/edogola4/Editor/main.svg?flag=client)](https://codecov.io/gh/edogola4/Editor)
  [![CI/CD](https://github.com/edogola4/Editor/actions/workflows/ci.yml/badge.svg)](https://github.com/edogola4/Editor/actions)
  [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
</div>

This is the frontend client for the Collaborative Code Editor application, built with React 19, TypeScript 5.8, Vite 5, and Monaco Editor for real-time collaborative coding.

## ✨ Features

### 🎯 **Core Features**
- **Real-time Collaboration**: Multi-user editing with operational transformation
- **WebSocket Synchronization**: Low-latency document synchronization
- **Professional Code Editor**: Monaco Editor with VS Code's powerful features
- **Live Cursor & Selection**: See other users' cursors and selections in real-time
- **User Presence**: Visual indicators showing connected users and their activity
- **Document Versioning**: Track changes and revert to previous versions
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between themes for comfortable coding

### 🚀 **Performance**
- **Efficient Sync**: Delta synchronization for large documents
- **Operation Batching**: Minimize network traffic with operation batching
- **Debounced Updates**: Optimize cursor and selection updates
- **Offline Support**: Continue editing with offline queue (coming soon)

### 🛡 **Security**
- **JWT Authentication**: Secure token-based authentication
- **WebSocket Security**: Encrypted communication with WSS
- **Input Validation**: Comprehensive client-side validation
- **Rate Limiting**: Protection against rapid operations

### 🎨 **Editor Features**
- **Monaco Editor**: Full VS Code editing experience with extensions support
- **IntelliSense**: Smart code completion, parameter hints, and hover information
- **Multi-cursor Support**: Multiple cursors for efficient editing
- **Themes**: Built-in light, dark, and high-contrast themes
- **Keybindings**: VS Code keybindings with customization options
- **Minimap**: Code overview for easy navigation
- **Bracket Pair Colorization**: Visual matching of brackets and indentation
- **Word Wrap**: Configurable text wrapping with word wrap guides
- **Auto-Formatting**: Built-in code formatting with Prettier
- **Language Support**: 50+ programming languages with syntax highlighting
- **Snippets**: Built-in code snippets for common patterns
- **Emmet Support**: HTML/CSS abbreviations expansion

### 🛠 **Technical Features**
- **React 19+**: Modern React with concurrent features
- **TypeScript 5.8+**: Full type safety and developer experience
- **Vite 5+**: Lightning-fast build tool and dev server
- **Zustand + Immer**: Lightweight state management with immutable updates
- **Socket.IO Client 4.8+**: Real-time communication with backend
- **Tailwind CSS 4+**: Utility-first CSS framework with custom theme
- **React Query 5+**: Server state management and data fetching
- **React Hook Form 7+**: Form handling with validation
- **Axios 1.7+**: HTTP client for API communication
- **React Hot Toast 2.4+**: Beautiful notifications
- **React Icons 5.0+**: Comprehensive icon library
- **React Router DOM 7+**: Client-side routing with nested routes
- **Monaco Editor 0.53+**: VS Code's editor component for the web
- **Vitest 3.2+**: Modern testing framework
- **Testing Library**: React component testing utilities

## 🛠 Tech Stack

### **Frontend**
- **React 19+** - Modern React with concurrent features
- **TypeScript 5.8+** - Type-safe development
- **Vite 5+** - Next generation frontend tooling
- **Tailwind CSS 4+** - Utility-first CSS framework
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
- **ESLint 8.56+** - Code linting
- **Prettier 3.2+** - Code formatting
- **Vitest 3.2+** - Testing framework
- **Testing Library 14+** - React component testing

### **Development & Quality**
- **ESLint 8.56+** - Code linting with TypeScript support
- **Prettier 3.2+** - Opinionated code formatting
- **TypeScript ESLint 7+** - TypeScript-specific linting rules
- **Vitest 3.2+** - Modern testing framework
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers
- **@testing-library/user-event** - User interaction testing
- **jsdom** - DOM environment for testing

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+** (LTS recommended)
- **pnpm 8+** (recommended package manager)
- **Git**
- **Backend Server**: See [server README](../server/README.md) for setup

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/edogola4/Editor.git
   cd Editor/client
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm test` - Run unit tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Lint code
- `pnpm format` - Format code with Prettier

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file with backend connection details
   # VITE_API_URL=http://localhost:5000
   # VITE_SERVER_URL=http://localhost:5000
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

4. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Login Required**: Use demo credentials to authenticate

## 🔑 Demo Credentials

For testing the application, use these demo credentials:

```javascript
Username: admin
Password: admin123
```

## 📱 Usage

### Basic Usage
1. Open the application in your browser at `http://localhost:5173`
2. Login using the demo credentials (or register a new account)
3. Start typing code in the Monaco Editor
4. Use the language selector to change programming languages
5. Experience syntax highlighting and IntelliSense in action

### Collaborative Features
1. Open multiple browser tabs/windows with different users
2. Each tab represents a different user session
3. See real-time cursor positions and user presence indicators
4. Experience live code synchronization across all connected clients
5. Watch as other users' changes appear instantly

### Supported Languages
- **JavaScript & TypeScript** - Full IntelliSense and error checking
- **Python** - Syntax highlighting and basic completion
- **Java** - Class and method completion
- **C++ & C#** - Syntax highlighting and basic support
- **Go & Rust** - Modern language support
- **PHP & Ruby** - Web development languages
- **HTML & CSS** - Frontend development
- **JSON & YAML** - Configuration files
- **Markdown** - Documentation and notes
- **And more...**

## 🧪 Testing

### Available Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/components/Editor.test.tsx
```

### Test Structure
- **Component Tests**: React component behavior and rendering
- **Integration Tests**: Full user workflows and interactions
- **Utility Tests**: Helper functions and business logic
- **E2E Tests**: End-to-end user journeys (planned)

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm run preview         # Preview production build locally

# Code Quality
npm run lint            # Check code quality
npm run lint:fix        # Auto-fix linting issues

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode for tests
npm run test:coverage   # Generate coverage report
```

## 📂 Project Structure

```
client/
├── src/
│   ├── components/              # React components
│   │   ├── CodeEditor.tsx       # Main Monaco editor component
│   │   ├── Login.tsx            # Authentication component
│   │   ├── UserPresence.tsx     # User presence indicators
│   │   └── StatusBar.tsx        # Status bar with connection info
│   ├── store/                   # State management
│   │   ├── authStore.ts         # Authentication state
│   │   └── editorStore.ts       # Editor state with collaboration
│   ├── utils/                   # Utility functions
│   │   ├── api.ts               # HTTP API client
│   │   └── socket.ts            # WebSocket connection manager
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── index.html                   # HTML template
├── package.json                 # Dependencies and scripts
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── .env                         # Environment variables
```

## 🔧 Environment Variables

Create a `.env` file in the client directory:

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

## 🏗 **Architecture Overview**

### **State Management**
- **Zustand**: Lightweight state management with TypeScript support
- **Immer**: Immutable state updates for complex objects
- **Auth Store**: User authentication and session management
- **Editor Store**: Code state, cursor positions, and collaboration data

### **Real-time Communication**
- **Socket.IO Client**: WebSocket connection with fallback to polling
- **Event-driven Architecture**: Clean separation of socket events
- **Optimistic Updates**: Immediate UI updates with server synchronization
- **Connection Management**: Automatic reconnection and error handling

### **Authentication Flow**
- **JWT-based Auth**: Secure token-based authentication with refresh tokens
- **Protected Routes**: Route-level authentication guards with role-based access
- **Session Persistence**: Secure token storage with httpOnly cookies
- **Auto-logout**: Token expiration handling with refresh token rotation
- **Form Validation**: Comprehensive client and server-side validation
- **Error Handling**: User-friendly error messages for auth failures
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Built-in CSRF protection for all forms

### **Component Architecture**
- **Atomic Design**: Reusable components with clear interfaces
- **TypeScript Interfaces**: Strongly typed component props
- **Custom Hooks**: Reusable logic extraction
- **Error Boundaries**: Graceful error handling

## 🎨 Customization

### **Themes**
- **Dark Theme**: Professional coding environment
- **Custom Colors**: Tailwind CSS color palette
- **Monaco Editor**: VS Code-compatible theming

### **Editor Configuration**
- **Font Settings**: Fira Code with ligatures
- **Tab Size**: 2-space indentation
- **Line Height**: Optimized for readability
- **Minimap**: Code overview navigation

### **Language Support**
- **TypeScript**: Full IntelliSense and error checking
- **JavaScript**: Modern ES6+ features
- **Python**: Popular web and data science language
- **Java**: Enterprise application development

## 🚀 Production Deployment

### **Prerequisites**
- Node.js 18+ and npm
- Backend server running
- Domain name (optional)

### **Build Process**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Deployment Options**
- **Static Hosting**: Deploy `dist/` folder to any static host
- **Docker**: Use the provided Dockerfile
- **CDN**: Serve assets through a CDN for better performance
- **SSR**: Future enhancement for SEO and performance

## 🔒 Security Features

- **CORS Protection**: Configured to accept requests from authorized origins
- **Input Validation**: Client-side and server-side validation
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Token-based request validation
- **Secure Headers**: Helmet.js on backend
- **Environment Variables**: Sensitive data in environment files

## 📊 Performance Optimization

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: WebP format support
- **Bundle Analysis**: Vite's built-in bundle analyzer
- **Caching**: Aggressive caching strategies
- **Minification**: Automatic CSS and JS minification

## 🧪 Testing Strategy

### **Unit Tests**
- Component rendering and behavior
- Utility function logic
- State management actions

### **Integration Tests**
- User authentication flows
- Real-time collaboration features
- API integration

### **E2E Tests (Planned)**
- Complete user journeys
- Multi-user collaboration
- Cross-browser compatibility

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
- Test across different browsers

## 📱 Browser Support

- **Chrome 90+** ✅ (Recommended)
- **Firefox 88+** ✅
- **Safari 14+** ✅
- **Edge 90+** ✅
- **Mobile Browsers** ✅ (Responsive design)

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - For the excellent code editing experience
- **React & TypeScript** - For the robust frontend framework
- **Vite** - For the incredibly fast development experience
- **Tailwind CSS** - For the beautiful and responsive UI
- **Socket.IO** - For real-time communication capabilities
- **Zustand & Immer** - For lightweight and efficient state management
- **Axios** - For reliable HTTP client functionality
- **React Hot Toast** - For beautiful notifications

---

<div align="center">
  <p>Built with ❤️ for seamless collaborative coding</p>
  <p><strong>Experience the future of collaborative development 🚀</strong></p>
</div>
