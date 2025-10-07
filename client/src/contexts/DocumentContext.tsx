import React, { createContext, useContext, useEffect, useState } from 'react';
import { Document } from '../services/DocumentService';

type DocumentContextType = {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: Error | null;
  loadDocuments: () => Promise<void>;
  loadDocument: (id: string) => Promise<void>;
  createDocument: (document: Partial<Document>) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  shareDocument: (documentId: string, userId: string, permission: 'read' | 'write' | 'admin') => Promise<void>;
};

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocument = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const doc = await documentService.getDocument(id);
      setCurrentDocument(doc);
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to load document ${id}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const createDocument = async (document: Partial<Document>): Promise<Document> => {
    setIsLoading(true);
    setError(null);
    try {
      const newDoc = await documentService.createDocument(document);
      setDocuments(prev => [...prev, newDoc]);
      return newDoc;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to create document:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>): Promise<Document> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedDoc = await documentService.updateDocument(id, updates);
      setDocuments(prev => 
        prev.map(doc => (doc.id === id ? updatedDoc : doc))
      );
      if (currentDocument?.id === id) {
        setCurrentDocument(updatedDoc);
      }
      return updatedDoc;
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to update document ${id}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      if (currentDocument?.id === id) {
        setCurrentDocument(null);
      }
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to delete document ${id}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const shareDocument = async (
    documentId: string, 
    userId: string, 
    permission: 'read' | 'write' | 'admin'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await documentService.shareDocument(documentId, userId, permission);
      // Refresh the current document to get updated collaborators
      if (currentDocument?.id === documentId) {
        await loadDocument(documentId);
      }
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to share document ${documentId}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <DocumentContext.Provider
      value={{
        documents,
        currentDocument,
        isLoading,
        error,
        loadDocuments,
        loadDocument,
        createDocument,
        updateDocument,
        deleteDocument,
        shareDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
