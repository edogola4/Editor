import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentAccess } from '../models/index.js';
import { authenticateWebSocket, AuthenticatedWebSocket } from '../middleware/wsAuth.js';

export interface User {
  id: string;
  name: string;
  color: string;
  cursorPosition?: {
    lineNumber: number;
    column: number;
  };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface DocumentState {
  id: string;
  content: string;
  language: string;
  users: Map<string, User>;
  version: number;
  lastModified: Date;
  lastModifiedBy: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private documents: Map<string, DocumentState> = new Map();
  private userSockets: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private async setupWebSocket() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
      if (!req.url) {
        ws.close(1008, 'Invalid URL');
        return;
      }

      // Extract token and document ID from URL
      const { token, documentId } = this.extractParamsFromUrl(req.url);
      
      if (!documentId) {
        ws.close(1008, 'Document ID is required');
        return;
      }

      // Authenticate user
      try {
        const isAuthenticated = await authenticateWebSocket(ws, token, documentId);
        if (!isAuthenticated || !ws.user) {
          ws.close(1008, 'Authentication failed');
          return;
        }
      } catch (error) {
        console.error('Authentication error:', error);
        ws.close(1011, 'Internal server error');
        return;
      }

      // Create or get document
      if (!this.documents.has(documentId)) {
        this.documents.set(documentId, {
          id: documentId,
          content: '',
          language: 'plaintext',
          users: new Map(),
          version: 0,
          lastModified: new Date(),
          lastModifiedBy: ws.user!.id,
        });
      }

      const document = this.documents.get(documentId)!;
      const userId = ws.user!.id;
      
      // Add user to document
      if (!document.users.has(userId)) {
        document.users.set(userId, {
          id: userId,
          name: ws.user!.name || 'Anonymous',
          color: this.generateRandomColor(),
        });
      }

      // Track user's WebSocket connection
      this.trackUserConnection(userId, ws);

      // Send document state to the new user
      ws.send(JSON.stringify({
        type: 'document-state',
        document: {
          id: document.id,
          content: document.content,
          language: document.language,
          version: document.version,
          lastModified: document.lastModified,
          lastModifiedBy: document.lastModifiedBy,
        },
        users: Array.from(document.users.values())
      }));

      // Notify other users about the new user
      this.broadcast(documentId, {
        type: 'user-joined',
        user: document.users.get(userId)
      }, [ws]);

      // Handle messages
      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          console.log('Received message:', data.type, 'from user:', userId);
          await this.handleMessage(ws, documentId, userId, data);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle user disconnection
      const handleDisconnect = () => {
        const user = document.users.get(userId);
        if (user) {
          // Only remove user if they have no more active connections
          const userConnections = this.userSockets.get(userId);
          if (userConnections && userConnections.size === 1) {
            document.users.delete(userId);
            this.broadcast(documentId, {
              type: 'user-left',
              userId,
              timestamp: new Date().toISOString()
            });
          }
          this.untrackUserConnection(userId, ws);
        }
      };

      ws.on('close', handleDisconnect);
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        handleDisconnect();
      });
    });
  }

  private async handleMessage(
    ws: WebSocket,
    documentId: string,
    userId: string,
    data: any
  ) {
    const document = this.documents.get(documentId);
    if (!document) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Document not found'
      }));
      return;
    }

    try {
      switch (data.type) {
        case 'content-update':
          if (typeof data.content === 'string') {
            document.content = data.content;
            document.version++;
            document.lastModified = new Date();
            document.lastModifiedBy = userId;
            
            // Broadcast to all clients except the sender
            this.broadcast(documentId, {
              type: 'content-update',
              content: data.content,
              version: document.version,
              lastModified: document.lastModified,
              lastModifiedBy: document.lastModifiedBy,
              userId // The user who made the change
            }, [ws]);
          }
          break;

        case 'cursor-move':
          const user = document.users.get(userId);
          if (user && data.position) {
            user.cursorPosition = data.position;
            
            // Broadcast cursor position to other users
            this.broadcast(documentId, {
              type: 'cursor-move',
              userId,
              position: data.position
            }, [ws]);
          }
          break;

        case 'selection-change':
          const userWithSelection = document.users.get(userId);
          if (userWithSelection && data.selection) {
            userWithSelection.selection = data.selection;
            
            // Broadcast selection to other users
            this.broadcast(documentId, {
              type: 'selection-change',
              userId,
              selection: data.selection
            }, [ws]);
          }
          break;

        case 'language-change':
          if (data.language) {
            document.language = data.language;
            this.broadcast(documentId, {
              type: 'language-change',
              language: data.language,
              userId
            });
          }
          break;

        case 'ping':
          // Respond to ping with pong
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
          break;

        default:
          console.warn('Unknown message type:', data.type);
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error processing message'
        }));
      }
    }
  }

  private broadcast(
    documentId: string, 
    message: any, 
    exclude: WebSocket[] = []
  ) {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        console.warn(`Document ${documentId} not found for broadcast`);
        return;
      }

      const messageString = JSON.stringify(message);
      const excludeIds = exclude.map(ws => (ws as any).id || '');
      
      document.users.forEach((user, userId) => {
        const connections = this.userSockets.get(userId) || new Set();
        connections.forEach((ws) => {
          if (!excludeIds.includes((ws as any).id) && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(messageString);
            } catch (error) {
              console.error(`Error sending message to user ${userId}:`, error);
              // Clean up broken connections
              if (ws.readyState !== WebSocket.OPEN) {
                this.untrackUserConnection(userId, ws);
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('Error in broadcast:', error);
    }
  }

  private extractParamsFromUrl(url: string): { token?: string; documentId?: string } {
    try {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const token = params.get('token') || undefined;
      // Extract documentId from URL path if not in query params
      let documentId = params.get('documentId') || undefined;
      
      if (!documentId) {
        const match = url.match(/\/ws\/([^/\?]+)/);
        documentId = match ? match[1] : undefined;
      }
      
      return { token, documentId };
    } catch (error) {
      console.error('Error extracting params from URL:', error);
      return {};
    }
  }

  private trackUserConnection(userId: string, ws: AuthenticatedWebSocket) {
    try {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(ws);
      console.log(`User ${userId} connected. Active connections:`, this.userSockets.get(userId)?.size || 0);
    } catch (error) {
      console.error('Error tracking user connection:', error);
    }
  }

  private untrackUserConnection(userId: string, ws: AuthenticatedWebSocket) {
    try {
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        console.log(`User ${userId} disconnected. Remaining connections:`, userSockets.size);
        
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
          
          // If no more users in the document, clean it up after a delay
          const document = Array.from(this.documents.values())
            .find(doc => Array.from(doc.users.keys()).includes(userId));
            
          if (document) {
            const hasOtherUsers = Array.from(document.users.keys())
              .some(id => id !== userId && this.userSockets.has(id));
              
            if (!hasOtherUsers) {
              console.log(`No more active users in document ${document.id}. Scheduling cleanup.`);
              // Keep the document in memory for a while in case of reconnection
              setTimeout(() => {
                const doc = this.documents.get(document.id);
                if (doc && Array.from(doc.users.keys()).every(id => !this.userSockets.has(id))) {
                  console.log(`Cleaning up document ${document.id}`);
                  this.documents.delete(document.id);
                }
              }, 5 * 60 * 1000); // 5 minutes
            }
          }
        }
      }
    } catch (error) {
      console.error('Error untracking user connection:', error);
    }
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Light Blue
      '#96CEB4', // Green
      '#FFEEAD', // Yellow
      '#D4A5A5', // Pink
      '#9B59B6', // Purple
      '#E67E22', // Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default WebSocketService;
