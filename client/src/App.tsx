import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { CodeEditor } from './components/CodeEditor';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { useEditorStore } from './store/editorStore';
import { useSocket } from './utils/socket';
import { ThemeProvider } from './components/theme-provider';
import { ChatContainer } from './components/chat/ChatContainer';
import { ChatProvider } from './contexts/ChatContext';

// Import global styles with theme variables
import './globals.css';

function App() {
  const { documentId } = useEditorStore();
  const { joinDocument } = useSocket();
  const [hasError, setHasError] = useState(false);

  // Use a fixed document ID so all tabs can collaborate together
  useEffect(() => {
    if (!documentId || documentId === 'default') {
      // Use a fixed document ID for all tabs to enable collaboration
      const sharedDocumentId = 'shared_collaboration_session';
      useEditorStore.getState().setDocumentId(sharedDocumentId);
    }
  }, [documentId]);

  // Join document room when documentId is available
  useEffect(() => {
    if (documentId && documentId !== 'default') {
      joinDocument(documentId);
    }
  }, [documentId, joinDocument]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4">The application encountered an unexpected error.</p>
          <button
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <CodeEditor />
        <ChatContainer />
      </main>
      <StatusBar />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: '!bg-background !text-foreground !border !border-border',
          success: {
            className: '!bg-success/10 !text-success border !border-success/20',
            iconTheme: {
              primary: '#10b981',
              secondary: '#ecfdf5'
            },
          },
          error: {
            className: '!bg-destructive/10 !text-destructive border !border-destructive/20',
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fef2f2'
            },
          },
        }}
      />
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <ChatProvider>
        <App />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default AppWrapper;
