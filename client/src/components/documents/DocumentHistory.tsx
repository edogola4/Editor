import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '../../contexts/DocumentContext';
import { format } from 'date-fns';
import { Editor } from '@monaco-editor/react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  IconButton,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Restore as RestoreIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface Version {
  id: string;
  version: number;
  content: string;
  updatedAt: string;
  updatedBy: string;
}

const DocumentHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentDocument, restoreVersion } = useDocuments();
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Load document versions
  useEffect(() => {
    const loadVersions = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, you would fetch the versions from your API
        // const versions = await documentService.getDocumentHistory(id);
        // setVersions(versions);
        
        // Mock data for demonstration
        const mockVersions: Version[] = [
          {
            id: 'v1',
            version: 3,
            content: currentDocument?.content || '// Your code here',
            updatedAt: new Date().toISOString(),
            updatedBy: 'Current User',
          },
          {
            id: 'v2',
            version: 2,
            content: '// Previous version of your code',
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            updatedBy: 'Current User',
          },
          {
            id: 'v3',
            version: 1,
            content: '// Initial version',
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            updatedBy: 'Current User',
          },
        ];
        
        setVersions(mockVersions);
        if (mockVersions.length > 0) {
          setSelectedVersion(mockVersions[0]);
        }
      } catch (err) {
        console.error('Failed to load document versions:', err);
        setError('Failed to load document versions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVersions();
  }, [id, currentDocument]);

  const handleRestore = async () => {
    if (!selectedVersion || !id) return;
    
    setIsRestoring(true);
    setError(null);
    
    try {
      // In a real app, you would call the API to restore the version
      // await restoreVersion(id, selectedVersion.version);
      
      // For demo purposes, we'll just show a success message
      setRestoreSuccess(true);
      setTimeout(() => {
        setRestoreSuccess(false);
        setRestoreDialogOpen(false);
        // Optionally navigate back to the editor
        navigate(`/documents/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Failed to restore version:', err);
      setError('Failed to restore this version. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleVersionSelect = (version: Version) => {
    setSelectedVersion(version);
  };

  const openRestoreDialog = () => {
    setRestoreDialogOpen(true);
  };

  const closeRestoreDialog = () => {
    setRestoreDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mr: 2 }}
        >
          Retry
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate(`/documents/${id}`)}
        >
          Back to Document
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton
          onClick={() => navigate(`/documents/${id}`)}
          sx={{ mr: 2 }}
          aria-label="back to document"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Document History: {currentDocument?.title || 'Untitled Document'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <List dense>
              {versions.map((version) => (
                <React.Fragment key={version.id}>
                  <ListItem
                    button
                    selected={selectedVersion?.id === version.id}
                    onClick={() => handleVersionSelect(version)}
                  >
                    <ListItemText
                      primary={`Version ${version.version}`}
                      secondary={
                        <>
                          {format(new Date(version.updatedAt), 'MMM d, yyyy HH:mm')}
                          <br />
                          {version.updatedBy}
                        </>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    {version.version === 1 && (
                      <ListItemSecondaryAction>
                        <Typography variant="caption" color="text.secondary">
                          Initial version
                        </Typography>
                      </ListItemSecondaryAction>
                    )}
                    {selectedVersion?.id === version.id && (
                      <ListItemSecondaryAction>
                        <CheckIcon color="primary" fontSize="small" />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            {selectedVersion ? (
              <>
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <div>
                    <Typography variant="subtitle1">
                      Version {selectedVersion.version}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(selectedVersion.updatedAt), 'MMM d, yyyy HH:mm')} • {selectedVersion.updatedBy}
                    </Typography>
                  </div>
                  {selectedVersion.version !== versions[0]?.version && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<RestoreIcon />}
                      onClick={openRestoreDialog}
                      disabled={isRestoring}
                    >
                      {isRestoring ? 'Restoring...' : 'Restore this version'}
                    </Button>
                  )}
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Editor
                    height="100%"
                    language={currentDocument?.language || 'plaintext'}
                    value={selectedVersion.content}
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      renderWhitespace: 'selection',
                      wordWrap: 'on',
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: 'text.secondary',
                }}
              >
                <Typography>Select a version to view its content</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={closeRestoreDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Restore Version {selectedVersion?.version}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore this version? This will replace the current document content.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {restoreSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Version restored successfully!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRestoreDialog} disabled={isRestoring}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            color="primary"
            variant="contained"
            disabled={isRestoring || restoreSuccess}
            startIcon={isRestoring ? <CircularProgress size={20} /> : <RestoreIcon />}
          >
            {isRestoring ? 'Restoring...' : 'Restore Version'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentHistory;
