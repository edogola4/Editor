# Real-time Collaboration with Socket.IO

This document describes the Socket.IO implementation for real-time collaboration in the code editor.

## Architecture

The real-time collaboration system is built on top of Socket.IO with the following components:

1. **Socket Service** (`socket.service.ts`): Manages socket connections, events, and room management.
2. **Room Service** (`room.service.ts`): Handles room creation, joining, and user presence.
3. **Document Service** (`document.service.ts`): Manages document state and operational transformations.
4. **Redis Adapter**: Enables horizontal scaling of Socket.IO across multiple server instances.

## Features

### Room Management
- Create and join collaborative editing rooms
- Track user presence in rooms
- Enforce room size limits
- Handle user disconnections gracefully

### Document Operations
- Real-time text editing with Operational Transform (OT)
- Conflict resolution for concurrent edits
- Document versioning and history
- Efficient delta compression for network optimization

### Authentication & Security
- JWT-based authentication for socket connections
- Room-based access control
- Input validation and sanitization

## Setup

### Prerequisites

- Node.js 16+
- Redis server (for production)
- Environment variables (see `.env.example`)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Reference

### Socket Events

#### Client to Server
- `room:join` - Join a room
- `room:leave` - Leave the current room
- `document:operation` - Send a document operation
- `document:sync` - Request document synchronization
- `user:typing` - Notify when a user is typing

#### Server to Client
- `connection:ack` - Acknowledge connection
- `room:joined` - Confirm room join
- `room:left` - Notify when a user leaves
- `document:operation` - Broadcast document operations
- `document:state` - Send current document state
- `presence:update` - Update user presence
- `error` - Error notifications

## Operational Transform (OT) Implementation

The OT system handles concurrent edits with the following features:

- **Core Operations**: insert, delete, retain
- **Transformation Functions**: Resolve conflicts between concurrent operations
- **Version Control**: Track document versions for consistency
- **History Management**: Compress and manage operation history
- **Undo/Redo**: Support for undo/redo functionality
- **Delta Compression**: Optimize network traffic
- **Snapshots**: Generate and restore document snapshots

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure Redis for session storage and pub/sub
3. Use a process manager like PM2
4. Set up proper SSL/TLS for secure WebSocket connections

## Performance Considerations

- **Scaling**: The system is designed to scale horizontally using Redis
- **Optimizations**:
  - Operation batching
  - Delta compression
  - Efficient data structures for document state
  - Caching frequently accessed data

## Security

- All socket connections require JWT authentication
- Input validation on all events
- Rate limiting to prevent abuse
- Proper error handling to avoid leaking sensitive information

## Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Verify Redis is running if using multiple server instances
   - Check CORS configuration
   - Ensure proper JWT token is provided

2. **Performance Problems**:
   - Check Redis connection
   - Monitor server resources
   - Review operation history size

## License

[Your License Here]
