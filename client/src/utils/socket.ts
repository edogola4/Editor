import { io, Socket } from 'socket.io-client'
import { useEditorStore } from '../store/editorStore'

class SocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(userId: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      auth: { userId },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.handleReconnect()
    })

    // Listen for code changes from other users
    this.socket.on('code-change', (data: { code: string; userId: string }) => {
      useEditorStore.getState().setCode(data.code)
    })

    // Listen for language changes
    this.socket.on('language-change', (data: { language: string; userId: string }) => {
      useEditorStore.getState().setLanguage(data.language)
    })

    // Listen for cursor position updates
    this.socket.on('cursor-update', (data: { userId: string; position: { line: number; column: number } }) => {
      useEditorStore.getState().updateCursorPosition(data.userId, data.position)
    })

    // Listen for user connections/disconnections
    this.socket.on('user-joined', (data: { userId: string }) => {
      useEditorStore.getState().addConnectedUser(data.userId)
    })

    this.socket.on('user-left', (data: { userId: string }) => {
      useEditorStore.getState().removeConnectedUser(data.userId)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
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
}

export const socketManager = new SocketManager()

export const useSocket = () => {
  const socket = socketManager.getSocket()

  const emitCodeChange = (code: string) => {
    if (socket) {
      socket.emit('code-change', { code })
    }
  }

  const emitLanguageChange = (language: string) => {
    if (socket) {
      socket.emit('language-change', { language })
    }
  }

  const emitCursorUpdate = (position: { line: number; column: number }) => {
    if (socket) {
      socket.emit('cursor-update', { position })
    }
  }

  return {
    socket,
    emitCodeChange,
    emitLanguageChange,
    emitCursorUpdate,
  }
}
