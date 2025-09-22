<div align="center">
  <h1>CodeCollab</h1>
  <p><strong>Real-time collaborative code editor with GitHub integration</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Docker](https://img.shields.io/badge/Docker-2CA5E0?logo=docker&logoColor=white)](https://www.docker.com/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/CONTRIBUTING.md)
</div>

## 🚀 Features

- **Real-time Collaboration**
  - Multi-user editing with live synchronization
  - Real-time cursor positions and selections with user colors
  - Operational Transform for conflict resolution
  - Undo/redo across collaborative sessions

- **Powerful Code Editor**
  - Monaco Editor (VS Code's editor component)
  - Syntax highlighting for 10+ programming languages
  - IntelliSense and code completion
  - Dark/light theme support

- **Room Management**
  - Create/join rooms with shareable links
  - Password protection
  - User roles (owner, editor, viewer)
  - Session persistence

- **GitHub Integration**
  - Connect to GitHub repositories
  - Load files and directories
  - Commit and push changes
  - Create pull requests

- **Built-in Chat**
  - Real-time messaging
  - Code snippets support
  - User mentions

## 🛠 Tech Stack

- **Frontend**: React 18+, TypeScript, Vite
- **Code Editor**: Monaco Editor
- **Real-time**: Socket.io v4+
- **Backend**: Node.js 18+, Express.js
- **Database**: Redis (real-time), PostgreSQL (persistence)
- **Authentication**: JWT, GitHub OAuth
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library
- **Containerization**: Docker, Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/collaborative-code-editor.git
   cd collaborative-code-editor
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Update the .env file with your configuration
   ```

3. **Start the development environment**
   ```bash
   # Using Docker (recommended)
   docker-compose -f docker-compose.dev.yml up --build

   # Or run services separately
   # Start backend
   cd server && npm install && npm run dev
   # In a new terminal
   cd client && npm install && npm run dev
   ```

4. **Open in browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🐳 Production Deployment

1. **Build and run with Docker**
   ```bash
   docker-compose up --build -d
   ```

2. **Or deploy to Kubernetes**
   ```bash
   kubectl apply -f k8s/
   ```

## 📂 Project Structure

```
.
├── client/                 # Frontend React application
├── server/                # Backend Node.js server
├── docker/                # Docker configuration files
├── k8s/                   # Kubernetes manifests
├── .github/               # GitHub workflows and templates
└── docs/                  # Additional documentation
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Monaco Editor for the excellent code editing experience
- Socket.io for real-time communication
- The open-source community for amazing tools and libraries

---

<div align="center">
  Made with ❤️ by Bran Don | [@BrandonOgola](https://twitter.com/BrandonOgola)
</div>
