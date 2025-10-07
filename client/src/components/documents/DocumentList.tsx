import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../../contexts/DocumentContext';
import { Document } from '../../services/DocumentService';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

export const DocumentList: React.FC = () => {
  const navigate = useNavigate();
  const {
    documents,
    isLoading,
    error,
    createDocument,
    deleteDocument,
    shareDocument,
  } = useDocuments();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<Document | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write' | 'admin'>('write');
  const [newDocument, setNewDocument] = useState<Partial<Document>>({
    title: '',
    content: '',
    language: 'javascript',
    isPublic: false,
  });

  const handleCreateDocument = async () => {
    try {
      const doc = await createDocument(newDocument);
      setIsCreateDialogOpen(false);
      navigate(`/documents/${doc.id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  const handleOpenShareDialog = (document: Document) => {
    setDocumentToShare(document);
    setIsShareDialogOpen(true);
  };

  const handleShareDocument = async () => {
    if (!documentToShare) return;
    
    try {
      // In a real app, you would look up the user ID by email
      await shareDocument(documentToShare.id, shareEmail, sharePermission);
      setShareEmail('');
      setIsShareDialogOpen(false);
    } catch (error) {
      console.error('Failed to share document:', error);
    }
  };

  if (isLoading) {
    return <Typography>Loading documents...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error loading documents: {error.message}</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Documents
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          New Document
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No documents found. Create one to get started!
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow
                  key={doc.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <CodeIcon sx={{ mr: 1 }} />
                      {doc.title || 'Untitled Document'}
                    </Box>
                  </TableCell>
                  <TableCell>{doc.language}</TableCell>
                  <TableCell>
                    {format(new Date(doc.updatedAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/documents/${doc.id}`);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenShareDialog(doc);
                          }}
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Document Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Document</DialogTitle>
        <DialogContent>
          <Box mt={2} mb={3}>
            <TextField
              label="Document Title"
              fullWidth
              value={newDocument.title}
              onChange={(e) =>
                setNewDocument({ ...newDocument, title: e.target.value })
              }
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Language</InputLabel>
              <Select
                value={newDocument.language || 'javascript'}
                onChange={(e) =>
                  setNewDocument({
                    ...newDocument,
                    language: e.target.value as string,
                  })
                }
                label="Language"
              >
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDocument}
            variant="contained"
            color="primary"
            disabled={!newDocument.title.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Share "{documentToShare?.title || 'Document'}"
        </DialogTitle>
        <DialogContent>
          <Box mt={2} mb={3}>
            <TextField
              label="User Email"
              fullWidth
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              margin="normal"
              placeholder="user@example.com"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Permission</InputLabel>
              <Select
                value={sharePermission}
                onChange={(e: SelectChangeEvent<'read' | 'write' | 'admin'>) =>
                  setSharePermission(e.target.value as 'read' | 'write' | 'admin')
                }
                label="Permission"
              >
                <MenuItem value="read">Can View</MenuItem>
                <MenuItem value="write">Can Edit</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            {documentToShare?.collaborators && documentToShare.collaborators.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Shared with:
                </Typography>
                <ul>
                  {documentToShare.collaborators.map((collab) => (
                    <li key={collab.userId}>
                      {collab.userId} ({collab.permission})
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleShareDocument}
            variant="contained"
            color="primary"
            disabled={!shareEmail.trim()}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentList;
