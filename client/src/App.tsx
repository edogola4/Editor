import { Toaster } from 'react-hot-toast';
import { CodeEditor } from './components/CodeEditor';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { useEditorStore } from './store/editorStore';
import { useEffect } from 'react';
import { useSocket } from './utils/socket';
import { ThemeProvider } from './components/theme-provider';
import { ChatProvider } from './contexts/ChatContext';
import { ChatContainer } from './components/chat/ChatContainer';

// Import global styles with theme variables
import './globals.css';

function AppContent() {
  const { connectedUsers, documentId, cursorPositions } = useEditorStore();
  const { joinDocument } = useSocket();
  const [theme, setTheme] = React.useState('dark');
  
  // Get current user's cursor position (using a placeholder for current user ID)
  const currentUser = 'current-user'; // TODO: Replace with actual user ID from auth
  const cursorPosition = cursorPositions[currentUser] || { line: 0, column: 0 };
  const selection = {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 }
  };

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

  // Handler functions for header actions
  const handleShare = () => {
    const shareUrl = `${window.location.origin}?session=${documentId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        console.log('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };

  const handleSettings = () => {
    // Open settings modal
    console.log('Settings clicked');
  };
  
  const handleCommandPalette = () => {
    // Open command palette
    console.log('Command palette opened');
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header 
          documentId={documentId || 'Untitled'}
          users={connectedUsers.map((userId) => ({
            id: userId,
            name: `User ${userId.slice(0, 8)}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            cursor: { line: 1, column: 1 },
            selection: null,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
            isTyping: false,
            connectionStatus: 'online' as const
          }))}
          onShare={handleShare}
          onSettings={handleSettings}
          onThemeToggle={handleThemeToggle}
          onCommandPalette={handleCommandPalette}
        />
        
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
        <ChatContainer />
      </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
