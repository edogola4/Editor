# Collaborative Code Editor

<div align="center">
  <h1>🚀 Real-time Collaborative Code Editor</h1>
  <p><strong>Professional VS Code-like collaborative coding experience</strong></p>

  [![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4+-010101?logo=socket.io&logoColor=white)](https://socket.io/)
  [![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-0.53+-007ACC?logo=visual-studio-code&logoColor=white)](https://microsoft.github.io/monaco-editor/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

## ✨ Features

### 🎯 **Core Features**
- **Real-time Collaboration**: Multi-user editing with live synchronization
- **Professional Code Editor**: Monaco Editor with VS Code's powerful features
- **Live Cursor Sharing**: See other users' cursors and positions in real-time
- **User Presence**: Visual indicators showing connected users and their activity
- **Multi-language Support**: 15+ programming languages with syntax highlighting

### 🛠 **Editor Features**
- **Monaco Editor**: Full VS Code editing experience
- **IntelliSense**: Code completion, hover information, and error detection
- **Syntax Highlighting**: Beautiful syntax highlighting for all supported languages
- **Bracket Matching**: Automatic bracket pair colorization
- **Word Wrap**: Configurable text wrapping
- **Minimap**: Code overview for easy navigation
- **Multiple Themes**: Dark theme optimized for coding

### 🎨 **User Interface**
- **Modern Design**: Clean, professional interface inspired by VS Code
- **Responsive Layout**: Works perfectly on desktop and tablet devices
- **User Avatars**: Color-coded user identification system
- **Status Indicators**: Real-time connection and activity status
- **Customizable UI**: Tailwind CSS with custom theme colors

### 🔧 **Technical Features**
- **TypeScript**: Full type safety throughout the application
- **Zustand + Immer**: Lightweight state management with immutable updates
- **Socket.IO**: Real-time bidirectional communication
- **Component Architecture**: Modular, reusable React components
- **Hot Reload**: Fast development with Vite's HMR

## 🛠 Tech Stack

### **Frontend**
- **React 19+** - Modern React with latest features
- **TypeScript 5.8+** - Full type safety and developer experience
- **Vite 5+** - Lightning-fast build tool and dev server
- **Tailwind CSS 4+** - Utility-first CSS framework with custom theme
- **Monaco Editor 0.53+** - VS Code's editor component
- **Socket.IO Client 4+** - Real-time communication
- **Zustand 5+** - Lightweight state management
- **Immer 10+** - Immutable state updates

### **Backend**
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **Socket.IO 4+** - Real-time WebSocket communication
- **PostgreSQL** - Relational database
- **Redis** - Caching and pub/sub messaging
- **JWT** - Authentication and authorization

### **Development & Deployment**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancing
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **npm 9+** or **yarn 1.22+**
- **Git**

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collaborative-code-editor
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the backend server**
   ```bash
   cd server
   npm install
   npm run dev
   # Server runs on http://localhost:3001
   ```

4. **Start the frontend client** (in a new terminal)
   ```bash
   cd client
   npm install
   npm run dev
   # Client runs on http://localhost:5173
   ```

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001
   - **WebSocket**: ws://localhost:3001

## 📱 Usage

### Basic Usage
1. Open the application in your browser
2. Start typing code in the editor
3. Use the language selector to change programming languages
4. See syntax highlighting and IntelliSense in action

### Collaborative Features
1. Open multiple browser tabs/windows
2. Each tab represents a different user
3. See real-time cursor positions and user presence
4. Experience live code synchronization

### Supported Languages
- JavaScript & TypeScript
- Python
- Java
- C++ & C#
- Go & Rust
- PHP & Ruby
- HTML & CSS
- JSON & YAML
- Markdown
- And more...

## 🐳 Docker Deployment

### Development Environment
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production Environment
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📂 Project Structure

```
collaborative-code-editor/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── CodeEditor.tsx # Main editor component
│   │   │   ├── UserPresence.tsx # User presence indicators
│   │   │   └── StatusBar.tsx  # Status bar component
│   │   ├── store/             # State management
│   │   │   └── editorStore.ts # Zustand store with Immer
│   │   ├── utils/             # Utility functions
│   │   │   └── socket.ts      # Socket.IO client setup
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── tailwind.config.js     # Tailwind CSS configuration
├── server/                    # Backend Node.js/Express server
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── models/            # Data models
│   │   └── index.ts           # Server entry point
│   ├── db/                    # Database migrations
│   └── package.json           # Backend dependencies
├── nginx/                     # Nginx configuration
├── docker-compose.dev.yml     # Development Docker setup
├── docker-compose.prod.yml    # Production Docker setup
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collaborative_editor
DB_USER=editor_user
DB_PASSWORD=editor_pass123
DB_SSL=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# WebSocket Configuration
WS_PATH=/socket.io/
WS_CORS_ORIGIN=http://localhost:5173

# Client Configuration
VITE_SERVER_URL=http://localhost:3001
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - For the excellent code editing experience
- **Socket.IO** - For real-time communication capabilities
- **React & TypeScript** - For the robust frontend framework
- **Tailwind CSS** - For the beautiful and responsive UI
- **Vite** - For the incredibly fast development experience
- **Zustand & Immer** - For lightweight and efficient state management

---

<div align="center">
  <p>Made with ❤️ using cutting-edge web technologies</p>
  <p><strong>Experience the future of collaborative coding! 🚀</strong></p>
</div>
