import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { useDocuments } from '../../contexts/DocumentContext';
import { webSocketService } from '../../services/websocket.service';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Avatar,
  AvatarGroup,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';

// Define types for cursor positions
interface CursorPosition {
  lineNumber: number;
  column: number;
}

// Define types for user cursors
interface UserCursor {
  userId: string;
  userName: string;
  color: string;
  position: CursorPosition;
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentDocument,
    isLoading,
    error,
    loadDocument,
    updateDocument,
    deleteDocument,
  } = useDocuments();
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement>(null);
  const decorationsRef = useRef<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [cursorPositions, setCursorPositions] = useState<Record<string, UserCursor>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!id) return;

    const connectWebSocket = async () => {
      try {
        await webSocketService.connect(id);
        
        // Set up WebSocket event handlers
        webSocketService.onContentChange((content: string) => {
          if (editorRef.current && content !== editorRef.current.getValue()) {
            const position = editorRef.current.getPosition();
            editorRef.current.setValue(content);
            if (position) {
              editorRef.current.setPosition(position);
              editorRef.current.revealPositionInCenter(position);
            }
          }
        });

        webSocketService.onUserJoined((user: any) => {
          setSnackbar({
            open: true,
            message: `${user.name} joined the document`,
            severity: 'info',
          });
        });

        webSocketService.onUserLeft((userId: string) => {
          setCursorPositions(prev => {
            const newCursors = { ...prev };
            delete newCursors[userId];
            return newCursors;
          });
          setSnackbar({
            open: true,
            message: 'A user left the document',
            severity: 'warning',
          });
        });

        webSocketService.onCursorMoved((userId: string, position: any) => {
          // Update cursor position for the user
          setCursorPositions(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              position,
            },
          }));
        });

        webSocketService.onLanguageChanged((language: string) => {
          if (editorRef.current && currentDocument) {
            const model = editorRef.current.getModel();
            if (model) {
              monaco.editor.setModelLanguage(model, language);
            }
          }
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setSnackbar({
          open: true,
          message: 'Failed to connect to the collaboration server',
          severity: 'error',
        });
      }
    };

    connectWebSocket();

    // Clean up WebSocket connection
    return () => {
      webSocketService.disconnect();
    };
  }, [id]);

  // Load document when component mounts or ID changes
  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
  }, [id, loadDocument]);

  // Initialize Monaco Editor
  useEffect(() => {
    if (monacoEl.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(monacoEl.current, {
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

      // Handle content changes
      const model = editorRef.current.getModel();
      if (model) {
        const updateContent = () => {
          const content = editorRef.current?.getValue() || '';
          if (currentDocument && content !== currentDocument.content) {
            setSaveStatus('saving');
            webSocketService.sendContentUpdate(content);
            
            // Debounce the save to avoid too many requests
            const timeoutId = setTimeout(async () => {
              try {
                await updateDocument(currentDocument.id, { content });
                setSaveStatus('saved');
              } catch (error) {
                console.error('Failed to save document:', error);
                setSaveStatus('error');
              }
            }, 1000);

            return () => clearTimeout(timeoutId);
          }
        };

        model.onDidChangeContent(updateContent);
      }

      // Handle cursor position changes
      editorRef.current.onDidChangeCursorPosition((e) => {
        webSocketService.sendCursorMove({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      });
    }

    // Clean up
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [currentDocument, updateDocument]);

  // Update editor content when document changes
  useEffect(() => {
    if (editorRef.current && currentDocument) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== currentDocument.content) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(currentDocument.content);
        if (position) {
          editorRef.current.setPosition(position);
          editorRef.current.revealPositionInCenter(position);
        }
      }

      // Update language if changed
      const model = editorRef.current.getModel();
      if (model && model.getLanguageId() !== currentDocument.language) {
        monaco.editor.setModelLanguage(model, currentDocument.language);
      }
    }
  }, [currentDocument]);

  // Render remote cursors
  useEffect(() => {
    if (!editorRef.current) return;

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    const newDecorations: string[] = [];

    Object.entries(cursorPositions).forEach(([userId, cursor]) => {
      if (!cursor.position) return;

      const { lineNumber, column } = cursor.position;
      const userName = cursor.userName || 'Anonymous';

      decorations.push({
        range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
        options: {
          className: 'remote-cursor',
          glyphMarginClassName: 'remote-cursor-glyph',
          hoverMessage: { value: userName },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Add selection if available
      if (cursor.selection) {
        decorations.push({
          range: new monaco.Range(
            cursor.selection.startLineNumber,
            cursor.selection.startColumn,
            cursor.selection.endLineNumber,
            cursor.selection.endColumn
          ),
          options: {
            className: 'remote-selection',
            hoverMessage: { value: `${userName}'s selection` },
          },
        });
      }
    });

    const model = editorRef.current.getModel();
    if (model) {
      newDecorations.push(...editorRef.current.deltaDecorations(decorationsRef.current, decorations));
      decorationsRef.current = newDecorations;
    }

    return () => {
      if (editorRef.current) {
        decorationsRef.current = [];
      }
    };
  }, [cursorPositions]);

  const handleSave = async () => {
    if (!currentDocument || !editorRef.current) return;

    setIsSaving(true);
    try {
      const content = editorRef.current.getValue();
      await updateDocument(currentDocument.id, { content });
      setSaveStatus('saved');
      setSnackbar({
        open: true,
        message: 'Document saved successfully',
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

  const handleLanguageChange = async (event: SelectChangeEvent) => {
    if (!currentDocument) return;
    
    const language = event.target.value;
    try {
      await updateDocument(currentDocument.id, { language });
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, language);
        }
      }
      webSocketService.sendLanguageChange(language);
    } catch (error) {
      console.error('Failed to update document language:', error);
    }
  };

  const handleDeleteDocument = async () => {
    if (!currentDocument) return;
    
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await deleteDocument(currentDocument.id);
        navigate('/documents');
      } catch (error) {
        console.error('Failed to delete document:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete document',
          severity: 'error',
        });
      }
    }
  };

  const handleCopyLink = () => {
    if (!currentDocument) return;
    
    const url = `${window.location.origin}/documents/${currentDocument.id}`;
    navigator.clipboard.writeText(url);
    setSnackbar({
      open: true,
      message: 'Document link copied to clipboard',
      severity: 'success',
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShareClick = () => {
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleViewHistory = () => {
    if (!currentDocument) return;
    navigate(`/documents/${currentDocument.id}/history`);
    handleMenuClose();
  };

  if (isLoading && !currentDocument) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading document: {error.message}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/documents')}
          sx={{ mt: 2 }}
        >
          Back to Documents
        </Button>
      </Box>
    );
  }

  if (!currentDocument) {
    return (
      <Box p={3}>
        <Typography>Document not found</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/documents')}
          sx={{ mt: 2 }}
        >
          Back to Documents
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton
          onClick={() => navigate('/documents')}
          sx={{ mr: 2 }}
          aria-label="back to documents"
        >
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentDocument.title || 'Untitled Document'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {saveStatus === 'saving' ? (
                <>
                  <CircularProgress size={12} sx={{ mr: 0.5 }} /> Saving...
                </>
              ) : saveStatus === 'saved' ? (
                `Last saved ${format(new Date(currentDocument.updatedAt), 'MMM d, yyyy HH:mm')}`
              ) : (
                'Error saving changes'
              )}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 150, mr: 1 }}>
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={currentDocument.language || 'plaintext'}
              onChange={handleLanguageChange}
              label="Language"
              size="small"
            >
              <MenuItem value="plaintext">Plain Text</MenuItem>
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="typescript">TypeScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="java">Java</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="css">CSS</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <IconButton
            onClick={handleMenuOpen}
            aria-label="more options"
            aria-controls="document-options-menu"
            aria-haspopup="true"
          >
            <MoreVertIcon />
          </IconButton>

          <Menu
            id="document-options-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleShareClick}>
              <PersonAddIcon sx={{ mr: 1 }} /> Share
            </MenuItem>
            <MenuItem onClick={handleViewHistory}>
              <HistoryIcon sx={{ mr: 1 }} /> View History
            </MenuItem>
            <MenuItem onClick={handleCopyLink}>
              <ContentCopyIcon sx={{ mr: 1 }} /> Copy Link
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteDocument} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} /> Delete Document
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Editor */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <div
          ref={monacoEl}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          fontSize: '0.75rem',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {Object.values(cursorPositions).length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary">
                Online:
              </Typography>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                {Object.entries(cursorPositions).map(([userId, cursor]) => (
                  <Tooltip key={userId} title={cursor.userName}>
                    <Avatar
                      sx={{
                        bgcolor: cursor.color,
                        width: 24,
                        height: 24,
                        fontSize: '0.75rem',
                      }}
                    >
                      {cursor.userName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {currentDocument.language}
        </Typography>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default DocumentEditor;
