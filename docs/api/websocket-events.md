# WebSocket Event Documentation

## Connection

### Connection URL
```
wss://your-domain.com/socket.io
```

### Connection Parameters
- `token`: JWT authentication token (required)
- `documentId`: ID of the document to collaborate on (required)
- `clientId`: Unique client identifier (optional, auto-generated if not provided)

## Event Types

### Client to Server

#### `joinDocument`
Join a document room for real-time collaboration.

**Payload:**
```typescript
{
  documentId: string;  // Document ID to join
  userId: string;      // Current user ID
  userName: string;    // Display name of the user
  cursorPosition?: {   // Optional initial cursor position
    line: number;
    column: number;
  };
}
```

#### `leaveDocument`
Leave a document room.

**Payload:**
```typescript
{
  documentId: string;  // Document ID to leave
  userId: string;      // User ID leaving
}
```

#### `textChange`
Send text changes to the server for synchronization.

**Payload:**
```typescript
{
  documentId: string;  // Document ID
  version: number;     // Document version before changes
  changes: {
    from: { line: number, ch: number };  // Start position
    to: { line: number, ch: number };    // End position (for selection)
    text: string[];                      // Array of lines to insert
    removed: string[];                   // Array of lines removed
  }[];
  clientId: string;    // Client ID for operation tracking
  userId: string;      // User ID making changes
}
```

#### `cursorMove`
Broadcast cursor movement to other clients.

**Payload:**
```typescript
{
  documentId: string;  // Document ID
  userId: string;      // User ID
  position: {
    line: number;      // Line number (0-based)
    ch: number;        // Column number (0-based)
  };
  selection?: {        // Optional selection range
    from: { line: number, ch: number };
    to: { line: number, ch: number };
  };
}
```

### Server to Client

#### `documentChange`
Broadcast document changes to all connected clients.

**Payload:**
```typescript
{
  documentId: string;  // Document ID
  version: number;     // New document version
  changes: {
    from: { line: number, ch: number };
    to: { line: number, ch: number };
    text: string[];
    removed: string[];
  }[];
  clientId: string;    // Original client ID that made the change
  userId: string;      // User ID who made the change
  timestamp: string;   // ISO timestamp of the change
}
```

#### `userJoined`
Notify clients when a new user joins the document.

**Payload:**
```typescript
{
  documentId: string;  // Document ID
  user: {
    id: string;        // User ID
    name: string;      // Display name
    color: string;     // Assigned color for the user
    cursor?: {         // Current cursor position
      line: number;
      ch: number;
    };
  };
  activeUsers: Array<{  // List of all active users
    id: string;
    name: string;
    color: string;
    cursor?: {
      line: number;
      ch: number;
    };
  }>;
}
```

#### `userLeft`
Notify clients when a user leaves the document.

**Payload:**
```typescript
{
  documentId: string;  // Document ID
  userId: string;      // User ID who left
  activeUsers: Array<{  // Updated list of active users
    id: string;
    name: string;
    color: string;
  }>;
}
```

#### `cursorMoved`
Broadcast cursor movement to other clients.

**Payload:**
```typescript
{
  documentId: string;  // Document ID
  userId: string;      // User ID who moved the cursor
  position: {
    line: number;      // New line number
    ch: number;        // New column number
  };
  selection?: {        // Optional selection range
    from: { line: number, ch: number };
    to: { line: number, ch: number };
  };
}
```

## Error Events

#### `error`
Sent when an error occurs during WebSocket communication.

**Payload:**
```typescript
{
  code: string;        // Error code (e.g., 'AUTH_ERROR', 'INVALID_DOCUMENT')
  message: string;     // Human-readable error message
  timestamp: string;   // ISO timestamp
  details?: any;       // Additional error details
}
```

## Example Usage

### Connecting to a Document
```javascript
const socket = io('wss://your-domain.com/socket.io', {
  query: {
    token: 'your-jwt-token',
    documentId: 'document-123'
  }
});

// Join the document
socket.emit('joinDocument', {
  documentId: 'document-123',
  userId: 'user-456',
  userName: 'John Doe'
});

// Listen for document changes
socket.on('documentChange', (data) => {
  console.log('Document changed:', data);
  // Apply changes to the editor
});

// Send cursor position updates
function onCursorMove(position) {
  socket.emit('cursorMove', {
    documentId: 'document-123',
    userId: 'user-456',
    position: position
  });
}
```

### Handling Reconnection
```javascript
// Handle reconnection
socket.on('reconnect_attempt', () => {
  // Update UI to show reconnecting state
  console.log('Attempting to reconnect...');
});

socket.on('reconnect', () => {
  // Rejoin the document after reconnection
  socket.emit('joinDocument', {
    documentId: 'document-123',
    userId: 'user-456',
    userName: 'John Doe'
  });
  
  // Update UI to show connected state
  console.log('Reconnected successfully');
});
```

## Best Practices

1. **Throttle Events**: Throttle cursor movement events to reduce network traffic.
2. **Handle Reconnection**: Implement proper reconnection logic with exponential backoff.
3. **Batch Changes**: When possible, batch multiple changes into a single message.
4. **Error Handling**: Always listen for error events and handle them gracefully.
5. **Connection State**: Show connection status to users for better UX.
6. **Compression**: Enable WebSocket compression if supported by your server.
7. **Ping/Pong**: Use WebSocket ping/pong to detect disconnections quickly.
