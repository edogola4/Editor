import { Toaster } from 'react-hot-toast'
import { CodeEditor } from './components/CodeEditor'
import { UserPresence } from './components/UserPresence'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { FileExplorer } from './components/FileExplorer'
import { useEditorStore } from './store/editorStore'
import './App.css'
import { useEffect } from 'react'
import { useSocket } from './utils/socket'
import { useAuthStore } from './store/authStore'

function App() {
  const { connectedUsers, documentId } = useEditorStore()
  const { user } = useAuthStore()
  const { joinDocument } = useSocket()

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

  return (
    <>
      <div className="h-screen w-screen bg-gray-900 overflow-hidden flex flex-col">
        {/* Modern Header */}
        <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700/50 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CE</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white tracking-tight">
                    Collaborative Editor
                  </h1>
                  <p className="text-xs text-gray-400 -mt-1">Real-time code collaboration</p>
                </div>
              </div>

              {/* Document Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300 font-mono">
                    {documentId ? documentId.slice(0, 20) + '...' : 'Loading...'}
                  </span>
                </div>
                <div className="text-sm text-green-400 font-medium px-3 py-1 bg-green-400/10 rounded-full border border-green-400/20">
                  🔗 Live Session
                </div>
                {user && (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-300">{user.username}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <UserPresence />
              <Toolbar />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - File Explorer */}
          <div className="w-64 bg-gray-800/30 border-r border-gray-700/50 flex flex-col">
            <FileExplorer />
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 relative">
              <CodeEditor height="100%" />
            </main>

            {/* Status Bar */}
            <StatusBar showDetailed={true} />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            borderRadius: '8px',
            padding: '16px',
          },
        }}
      />
    </>
  )
}

export default App
