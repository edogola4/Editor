import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { Box, Paper, Typography, Toolbar, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Save as SaveIcon, People as PeopleIcon } from '@mui/icons-material';
import { useDocuments } from '../../contexts/DocumentContext';
import { webSocketService } from '../../services/websocket.service';
import { useAuth } from '../../contexts/AuthContext';
import { CollaborationStatus } from './CollaborationStatus';
import { CursorIndicator } from './CursorIndicator';

interface RemoteUser {
  id: string;
  name: string;
  color: string;
  position: { lineNumber: number; column: number };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  lastSeen?: Date;
  isActive: boolean;
}

export const CollaborativeEditor: React.FC = () => {
  const { id: documentId } = useParams<{ id: string }>();
  const { currentDocument, isLoading, updateDocument } = useDocuments();
  const { user: currentUser } = useAuth();
  const [editor, setEditor] = useState<monaco.editor.ICodeEditor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    const newEditor = monaco.editor.create(editorRef.current, {
      value: currentDocument?.content || '',
      language: currentDocument?.language || 'plaintext',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
    });

    setEditor(newEditor);

    // Clean up
    return () => {
      newEditor.dispose();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle content changes
  useEffect(() => {
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const handleContentChange = () => {
      const content = editor.getValue();
      
      // Update local state
      setSaveStatus('saving');
      
      // Debounce the save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (documentId && content !== currentDocument?.content) {
            await updateDocument(documentId, { content });
            setSaveStatus('saved');
          }
        } catch (error) {
          console.error('Failed to save document:', error);
          setSaveStatus('error');
          setSnackbar({
            open: true,
            message: 'Failed to save document',
            severity: 'error',
          });
        }
      }, 1000);

      // Broadcast changes to other users
      webSocketService.sendContentUpdate(content);
    };

    // Handle cursor position changes
    const handleCursorChange = (e: editor.ICursorPositionChangedEvent) => {
      webSocketService.sendCursorMove({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    };

    // Handle selection changes
    const handleSelectionChange = (e: editor.ICursorSelectionChangedEvent) => {
      if (e.selection) {
        webSocketService.sendSelectionChange({
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn,
        });
      }
    };

    // Set up event listeners
    model.onDidChangeContent(handleContentChange);
    editor.onDidChangeCursorPosition(handleCursorChange);
    editor.onDidChangeCursorSelection(handleSelectionChange);

    // Clean up
    return () => {
      model.onDidChangeContent(() => {});
      editor.onDidChangeCursorPosition(() => {});
      editor.onDidChangeCursorSelection(() => {});
    };
  }, [editor, currentDocument, documentId, updateDocument]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!editor || !documentId) return;

    // Handle content updates from other users
    const handleContentUpdate = (data: { userId: string; content: string }) => {
      if (data.userId === currentUser?.id) return;
      
      const currentContent = editor.getValue();
      if (currentContent !== data.content) {
        const position = editor.getPosition();
        editor.setValue(data.content);
        if (position) {
          editor.setPosition(position);
          editor.revealPositionInCenter(position);
        }
      }
    };

    // Handle cursor movements from other users
    const handleCursorMove = (data: { userId: string; position: any }) => {
      if (data.userId === currentUser?.id) return;
      
      setRemoteUsers(prev => ({
        ...prev,
        [data.userId]: {
          ...(prev[data.userId] || { id: data.userId, name: 'Anonymous' }),
          position: data.position,
          lastSeen: new Date(),
          isActive: true,
        },
      }));
    };

    // Handle selection changes from other users
    const handleSelectionChange = (data: { userId: string; selection: any }) => {
      if (data.userId === currentUser?.id) return;
      
      setRemoteUsers(prev => ({
        ...prev,
        [data.userId]: {
          ...(prev[data.userId] || { id: data.userId, name: 'Anonymous' }),
          selection: data.selection,
          lastSeen: new Date(),
          isActive: true,
        },
      }));
    };

    // Handle user join/leave events
    const handleUserJoined = (user: any) => {
      setRemoteUsers(prev => ({
        ...prev,
        [user.id]: {
          ...user,
          lastSeen: new Date(),
          isActive: true,
        },
      }));
      
      setSnackbar({
        open: true,
        message: `${user.name || 'A user'} joined the document`,
        severity: 'info',
      });
    };

    const handleUserLeft = (userId: string) => {
      setRemoteUsers(prev => {
        const newUsers = { ...prev };
        if (newUsers[userId]) {
          newUsers[userId] = {
            ...newUsers[userId],
            isActive: false,
            lastSeen: new Date(),
          };
        }
        return newUsers;
      });
    };

    // Set up WebSocket listeners
    const unsubContent = webSocketService.onContentUpdate(handleContentUpdate);
    const unsubCursor = webSocketService.onCursorMoved(handleCursorMove);
    const unsubSelection = webSocketService.onSelectionChanged(handleSelectionChange);
    const unsubJoin = webSocketService.onUserJoined(handleUserJoined);
    const unsubLeave = webSocketService.onUserLeft(handleUserLeft);

    // Connect to WebSocket
    webSocketService.connect(documentId).catch(error => {
      console.error('Failed to connect to WebSocket:', error);
      setSnackbar({
        open: true,
        message: 'Failed to connect to collaboration server',
        severity: 'error',
      });
    });

    // Clean up
    return () => {
      unsubContent();
      unsubCursor();
      unsubSelection();
      unsubJoin();
      unsubLeave();
      webSocketService.disconnect();
    };
  }, [editor, documentId, currentUser]);

  // Update editor content when document changes
  useEffect(() => {
    if (!editor || !currentDocument) return;

    const currentValue = editor.getValue();
    if (currentValue !== currentDocument.content) {
      const position = editor.getPosition();
      editor.setValue(currentDocument.content);
      if (position) {
        editor.setPosition(position);
        editor.revealPositionInCenter(position);
      }
    }

    // Update language if changed
    const model = editor.getModel();
    if (model && model.getLanguageId() !== currentDocument.language) {
      monaco.editor.setModelLanguage(model, currentDocument.language);
    }
  }, [currentDocument, editor]);

  // Clean up save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle manual save
  const handleSave = async () => {
    if (!editor || !documentId) return;

    setIsSaving(true);
    try {
      const content = editor.getValue();
      await updateDocument(documentId, { content });
      setSaveStatus('saved');
      setSnackbar({
        open: true,
        message: 'Document saved',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to save document:', error);
      setSaveStatus('error');
      setSnackbar({
        open: true,
        message: 'Failed to save document',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter out inactive users
  const activeUsers = Object.values(remoteUsers).filter(
    user => user.isActive || (user.lastSeen && (Date.now() - user.lastSeen.getTime() < 30000))
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Toolbar 
        variant="dense" 
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        <Box display="flex" alignItems="center">
          <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <CollaborationStatus documentId={documentId || ''} />
        </Box>
        
        <Box display="flex" alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'All changes saved' : 'Error saving'}
          </Typography>
          
          <Button
            variant="contained"
            size="small"
            startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
            sx={{ ml: 1 }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Toolbar>

      {/* Editor */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div
          ref={editorRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
        
        {/* Render cursor indicators for other users */}
        {editor &&
          activeUsers
            .filter(user => user.id !== currentUser?.id && user.position)
            .map(user => (
              <CursorIndicator
                key={user.id}
                editor={editor}
                userId={user.id}
                user={{
                  id: user.id,
                  name: user.name || 'Anonymous',
                  color: user.color || '#666',
                  position: user.position,
                  selection: user.selection,
                }}
              />
            ))}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CollaborativeEditor;
