# Contributing to Collaborative Code Editor

We're excited you're interested in contributing! This guide will help you get started with the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you're expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+ or pnpm 7+
- PostgreSQL 14+
- Redis 7+
- Git

### Installation

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/collaborative-code-editor.git
   cd collaborative-code-editor
   ```
3. Install dependencies:
   ```bash
   # Using pnpm (recommended)
   pnpm install
   
   # Or using npm
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. Start the development servers:
   ```bash
   # Start both frontend and backend
   pnpm dev
   
   # Or start them separately
   cd client && pnpm dev
   cd server && pnpm dev
   ```

## Development Workflow

### Branch Naming

Use the following format for branch names:

```
type/description
```

Where `type` is one of:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process or auxiliary tools

Example: `feat/authentication`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Example:
```
feat(auth): add Google OAuth support

- Add Google OAuth2 authentication
- Update user model with OAuth fields
- Add login/logout UI components

Closes #123
```

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the [TypeScript style guide](https://google.github.io/styleguide/tsguide.html)
- Use ESLint and Prettier for code formatting
- Run linter before committing:
  ```bash
  pnpm lint
  ```

### React
- Use functional components with hooks
- Follow the [React Hooks rules](https://reactjs.org/docs/hooks-rules.html)
- Use TypeScript interfaces for props and state
- Keep components small and focused

### Database
- Use migrations for schema changes
- Add indexes for frequently queried fields
- Document complex queries

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run frontend tests
cd client && pnpm test

# Run backend tests
cd server && pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests
- Write unit tests for utility functions
- Write integration tests for API endpoints
- Use React Testing Library for component tests
- Mock external dependencies

## Pull Request Process

1. Fork the repository and create your feature branch
2. Commit your changes following the commit message guidelines
3. Push to your fork and submit a pull request
4. Ensure all tests pass
5. Update the documentation if needed
6. Request review from at least one maintainer

## Reporting Issues

When reporting issues, please include:

1. A clear title and description
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Browser/OS version
6. Any error messages

## Feature Requests

For feature requests:

1. Check if a similar feature already exists
2. Explain why this feature is needed
3. Describe how it should work
4. Include any relevant use cases

## Documentation

### Updating Documentation

1. Update the relevant `.md` files in the `docs/` directory
2. Update code comments when making changes
3. Keep the README up to date

### Generating API Documentation

```bash
# Generate API documentation
cd server
pnpm docs

# View documentation
open docs/api/index.html
```

## Community

### Getting Help

- Join our [Discord server](https://discord.gg/your-invite-link)
- Check the [GitHub Discussions](https://github.com/your-username/collaborative-code-editor/discussions)
- Read the [FAQ](docs/FAQ.md)

### Becoming a Maintainer

We're always looking for active contributors to become maintainers. If you're interested:

1. Contribute regularly to the project
2. Help review pull requests
3. Participate in discussions
4. Let us know you're interested

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
