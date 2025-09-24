import { Toaster } from 'react-hot-toast'
import { CodeEditor } from './components/CodeEditor'
import { Header } from './components/Header'
import { Toolbar } from './components/Toolbar'
import { StatusBar } from './components/StatusBar'
import { useEditorStore } from './store/editorStore'
import './App.css'
import { useEffect } from 'react'
import { useSocket } from './utils/socket'

function App() {
  const { connectedUsers, documentId, cursorPositions } = useEditorStore()
  const { joinDocument } = useSocket()
  
  // Get current user's cursor position (using a placeholder for current user ID)
  const currentUser = 'current-user' // TODO: Replace with actual user ID from auth
  const cursorPosition = cursorPositions[currentUser] || { line: 0, column: 0 }
  const selection = {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 }
  }

  // Use a fixed document ID so all tabs can collaborate together
  useEffect(() => {
    if (!documentId || documentId === 'default') {
      // Use a fixed document ID for all tabs to enable collaboration
      const sharedDocumentId = 'shared_collaboration_session'
      useEditorStore.getState().setDocumentId(sharedDocumentId)
    }
  }, [documentId])

  // Join document room when documentId is available
  useEffect(() => {
    if (documentId && documentId !== 'default') {
      joinDocument(documentId)
    }
  }, [documentId])

  // Handler functions for header actions
  const handleShare = () => {
    const shareUrl = `${window.location.origin}?session=${documentId}`
    navigator.clipboard.writeText(shareUrl)
    // Could show a toast notification here
    console.log('Session URL copied to clipboard:', shareUrl)
  }

  const handleSettings = () => {
    console.log('Settings clicked')
    // Could open settings modal
  }

  const handleThemeToggle = () => {
    console.log('Theme toggle clicked')
    // Could toggle theme
  }

  const handleCommandPalette = () => {
    console.log('Command palette clicked')
    // Could open command palette
  }

  return (
    <>
      <div className="h-screen w-screen bg-slate-900 overflow-hidden relative">
        {/* Animated background gradient */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-purple-900/20 pointer-events-none"></div>

        <div className="h-full flex flex-col relative z-10">
          {/* Header */}
          <Header
            documentId={documentId || 'Loading...'}
            users={connectedUsers.map((userId) => ({
              id: userId,
              name: `User ${userId.slice(0, 8)}`,
              avatar: '',
              cursor: { line: 1, column: 1 },
              selection: null,
              color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
              isTyping: false,
              lastSeen: Date.now(),
              connectionStatus: 'online' as const
            }))}
            onShare={handleShare}
            onSettings={handleSettings}
            onThemeToggle={handleThemeToggle}
            onCommandPalette={handleCommandPalette}
          />

          {/* Toolbar */}
          <Toolbar actions={[]} />

          {/* Main Editor */}
          <main className="flex-1">
            <CodeEditor height="calc(100vh - 160px)" />
          </main>

          {/* Status Bar */}
          <StatusBar
            language="javascript"
            cursorPosition={cursorPosition}
            selection={selection}
            userCount={connectedUsers.length + 1}
            connectionStatus="connected"
            showDetailed={true}
          />
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #475569'
          },
        }}
      />
    </>
  )
}

export default App
