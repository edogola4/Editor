import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, User, Edit2, Trash2, Share2 } from 'lucide-react';
import './DocumentList.css';

interface Document {
  id: string;
  title: string;
  lastModified: string;
  owner: string;
  isOwner: boolean;
  language: string;
}

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocLanguage, setNewDocLanguage] = useState('javascript');
  
  const navigate = useNavigate();

  // Fetch user's documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call
        // const response = await fetch('/api/documents');
        // const data = await response.json();
        
        // Mock data for now
        const mockData: Document[] = [
          {
            id: 'doc-1',
            title: 'My First Document',
            lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            owner: 'You',
            isOwner: true,
            language: 'javascript'
          },
          {
            id: 'doc-2',
            title: 'Team Project',
            lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            owner: 'Alice',
            isOwner: false,
            language: 'python'
          },
        ];
        
        setDocuments(mockData);
      } catch (err) {
        setError('Failed to load documents');
        console.error('Error fetching documents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    try {
      // Replace with actual API call
      // const response = await fetch('/api/documents', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ title: newDocTitle, language: newDocLanguage })
      // });
      // const newDoc = await response.json();
      
      // Mock response
      const newDoc = {
        id: `doc-${Date.now()}`,
        title: newDocTitle,
        language: newDocLanguage,
        owner: 'You',
        isOwner: true,
        lastModified: new Date().toISOString()
      };
      
      setDocuments([newDoc, ...documents]);
      setShowCreateModal(false);
      setNewDocTitle('');
      
      // Navigate to the new document
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      setError('Failed to create document');
      console.error('Error creating document:', err);
    }
  };

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      // Replace with actual API call
      // await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      
      setDocuments(documents.filter(doc => doc.id !== docId));
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const languageIcons: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    html: 'html',
    css: 'css',
    json: 'json',
    markdown: 'md',
  };

  if (isLoading) {
    return (
      <div className="document-list-container">
        <div className="loading-spinner">Loading documents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-list-container">
        <div className="error-message">{error}</div>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="document-list-container">
      <div className="document-list-header">
        <h1>My Documents</h1>
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="create-doc-button"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          <span>New Document</span>
        </button>
      </div>

      <div className="documents-grid">
        {filteredDocs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>No documents found</h3>
            <p>Create your first document to get started</p>
            <button 
              className="create-first-doc"
              onClick={() => setShowCreateModal(true)}
            >
              Create Document
            </button>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              className="document-card"
              onClick={() => navigate(`/documents/${doc.id}`)}
            >
              <div className="document-card-header">
                <div className="document-language">
                  <span className={`language-icon ${doc.language}`}>
                    {languageIcons[doc.language] || doc.language.slice(0, 2)}
                  </span>
                  {doc.language}
                </div>
                <div className="document-actions">
                  <button 
                    className="icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle share
                    }}
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                  {doc.isOwner && (
                    <button 
                      className="icon-button"
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="document-title">{doc.title}</h3>
              <div className="document-meta">
                <span className="meta-item">
                  <User size={14} />
                  {doc.owner}
                </span>
                <span className="meta-item">
                  <Clock size={14} />
                  {formatDate(doc.lastModified)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-doc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Document</h2>
            <form onSubmit={handleCreateDocument}>
              <div className="form-group">
                <label htmlFor="docTitle">Title</label>
                <input
                  id="docTitle"
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="docLanguage">Language</label>
                <select
                  id="docLanguage"
                  value={newDocLanguage}
                  onChange={(e) => setNewDocLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
