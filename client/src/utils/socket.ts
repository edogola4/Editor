import { io, Socket } from 'socket.io-client'
import { useEditorStore } from '../store/editorStore'

class SocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private currentDocumentId = 'default'

  connect(userId: string, documentId: string = 'default') {
    if (this.socket?.connected) {
      // Rejoin the correct document room
      this.joinDocument(documentId)
      return this.socket
    }

    this.currentDocumentId = documentId
    this.socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      auth: { userId },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected successfully!')
      console.log('👤 User ID:', userId)
      console.log('📄 Document ID:', documentId)
      this.reconnectAttempts = 0
      // Join the document room after connection
      this.joinDocument(documentId)
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      this.handleReconnect()
    })

    // Listen for code changes from other users
    this.socket.on('code-change', (data: { code: string; userId: string }) => {
      console.log('📝 Received code change from:', data.userId)
      useEditorStore.getState().setCode(data.code)
    })

    // Listen for language changes
    this.socket.on('language-change', (data: { language: string; userId: string }) => {
      console.log('🌐 Received language change from:', data.userId)
      useEditorStore.getState().setLanguage(data.language)
    })

    // Listen for cursor position updates
    this.socket.on('cursor-update', (data: { userId: string; position: { line: number; column: number } }) => {
      console.log('🎯 Received cursor update from:', data.userId, 'at', data.position)
      useEditorStore.getState().updateCursorPosition(data.userId, data.position)
    })

    // Listen for user connections/disconnections
    this.socket.on('user-joined', (data: { userId: string }) => {
      console.log('👋 User joined:', data.userId)
      useEditorStore.getState().addConnectedUser(data.userId)
    })

    this.socket.on('user-left', (data: { userId: string }) => {
      console.log('👋 User left:', data.userId)
      useEditorStore.getState().removeConnectedUser(data.userId)
    })

    // Listen for document state updates
    this.socket.on('document:state', (data: { code: string; language: string; users: string[] }) => {
      console.log('📄 Received document state:', data)
      useEditorStore.getState().setCode(data.code)
      useEditorStore.getState().setLanguage(data.language)
      // Update connected users
      data.users.forEach(userId => {
        useEditorStore.getState().addConnectedUser(userId)
      })
    })

    // Listen for typing indicators
    this.socket.on('typing:start', (data: { userId: string }) => {
      console.log('⌨️ Typing started:', data.userId)
      useEditorStore.getState().setUserTyping(data.userId, true)
    })

    this.socket.on('typing:stop', (data: { userId: string }) => {
      console.log('⌨️ Typing stopped:', data.userId)
      useEditorStore.getState().setUserTyping(data.userId, false)
    })

    return this.socket
  }

  joinDocument(documentId: string) {
    if (this.socket) {
      // Leave current document room
      if (this.currentDocumentId !== 'default') {
        this.socket.emit('document:leave', { documentId: this.currentDocumentId })
        console.log('🚪 Leaving document room:', this.currentDocumentId)
      }

      // Join new document room
      this.currentDocumentId = documentId
      this.socket.emit('document:join', { documentId })
      console.log('🚪 Joining document room:', documentId)
    }
  }

  disconnect() {
    if (this.socket) {
      // Leave document room before disconnecting
      if (this.currentDocumentId !== 'default') {
        this.socket.emit('document:leave', { documentId: this.currentDocumentId })
      }
      this.socket.disconnect()
      this.socket = null
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect()
        }
      }, 1000 * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  getSocket() {
    return this.socket
  }

  getCurrentDocumentId() {
    return this.currentDocumentId
  }
}

export const socketManager = new SocketManager()

export const useSocket = () => {
  const socket = socketManager.getSocket()

  const emitCodeChange = (code: string, documentId: string = 'default') => {
    if (socket) {
      socket.emit('code-change', { code, documentId })
    }
  }

  const emitLanguageChange = (language: string, documentId: string = 'default') => {
    if (socket) {
      socket.emit('language-change', { language, documentId })
    }
  }

  const emitCursorUpdate = (position: { line: number; column: number }, documentId: string = 'default') => {
    if (socket) {
      socket.emit('cursor-update', { position, documentId })
    }
  }

  const emitTypingStart = (documentId: string = 'default') => {
    if (socket) {
      socket.emit('typing:start', { documentId })
    }
  }

  const emitTypingStop = (documentId: string = 'default') => {
    if (socket) {
      socket.emit('typing:stop', { documentId })
    }
  }

  const joinDocument = (documentId: string) => {
    socketManager.joinDocument(documentId)
  }

  return {
    socket,
    emitCodeChange,
    emitLanguageChange,
    emitCursorUpdate,
    emitTypingStart,
    emitTypingStop,
    joinDocument,
    getCurrentDocumentId: socketManager.getCurrentDocumentId,
  }
}
