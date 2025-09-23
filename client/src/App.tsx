import { Toaster } from 'react-hot-toast'
import { Login } from './components/Login'
import { CodeEditor } from './components/CodeEditor'
import { UserPresence } from './components/UserPresence'
import { StatusBar } from './components/StatusBar'
import { useEditorStore } from './store/editorStore'
import { useAuthStore } from './store/authStore'
import './App.css'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <>
        <Login />
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
                  Welcome back!
                </div>
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
