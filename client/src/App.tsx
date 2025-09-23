import { Toaster } from 'react-hot-toast'
import { CodeEditor } from './components/CodeEditor'
import { UserPresence } from './components/UserPresence'
import { StatusBar } from './components/StatusBar'
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
      <div className="h-screen w-screen bg-gray-900 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-white">
                  Collaborative Code Editor
                </h1>
                <div className="text-sm text-gray-300">
                  Document: {documentId ? documentId : 'Loading...'}
                </div>
                <div className="text-sm text-green-400 font-medium">
                  🔗 Shared Session - All tabs collaborate here!
                </div>
                {user && (
                  <div className="text-sm text-gray-400">
                    User: {user.username}
                  </div>
                )}
              </div>
              <UserPresence />
            </div>
          </header>

          {/* Main Editor */}
          <main className="flex-1">
            <CodeEditor height="calc(100vh - 120px)" />
          </main>

          {/* Status Bar */}
          <StatusBar showDetailed={true} />
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#374151',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App
