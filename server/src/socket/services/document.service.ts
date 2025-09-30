import { DocumentOperation } from '../types/events.js';
import { OT } from '../../ot/ot-core.js';
import { documentPersistenceService } from '../../services/documentPersistence.service.js';

type DocumentState = {
  content: string;
  version: number;
  operations: DocumentOperation[];
};

export class DocumentService {
  private documents: Map<string, DocumentState> = new Map();
  private operationHistory: Map<string, DocumentOperation[]> = new Map();
  private clientVersions: Map<string, number> = new Map(); // clientId -> version
  private ot = new OT();

  async createDocument(docId: string, initialContent: string = '', ownerId?: string): Promise<void> {
    this.documents.set(docId, {
      content: initialContent,
      version: 0,
      operations: [],
    });
    this.operationHistory.set(docId, []);

    // Load from database if exists
    if (ownerId) {
      const savedDoc = await documentPersistenceService.loadDocument(docId);
      if (savedDoc) {
        this.documents.set(docId, {
          content: savedDoc.content,
          version: savedDoc.version,
          operations: [],
        });
      }
    }
  }

  applyOperation(docId: string, operation: DocumentOperation): { success: boolean; error?: string } {
    const document = this.documents.get(docId);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    // Get the client's last known version
    const clientVersion = this.clientVersions.get(operation.clientId) || 0;
    
    // Check if the operation is from the future (shouldn't happen with proper client logic)
    if (operation.version > document.version + 1) {
      return { success: false, error: 'Operation from the future' };
    }

    // If operation is old, ignore it (already applied)
    if (operation.version <= clientVersion) {
      return { success: true };
    }

    try {
      // Transform the operation against all operations that happened since the client's version
      let transformedOp = { ...operation };
      
      for (let v = clientVersion; v < document.version; v++) {
        const prevOp = document.operations[v];
        if (!prevOp) continue;
        
        transformedOp = this.transformOperation(transformedOp, prevOp);
      }

      // Apply the transformed operation
      this.applyTransformedOperation(docId, transformedOp);
      
      // Update client's version
      this.clientVersions.set(operation.clientId, document.version);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private applyTransformedOperation(docId: string, operation: DocumentOperation): void {
    const document = this.documents.get(docId);
    if (!document) return;

    let newContent = '';
    let pos = 0;
    
    switch (operation.type) {
      case 'insert':
        newContent = document.content.slice(0, operation.position) + 
                    (operation.text || '') + 
                    document.content.slice(operation.position);
        break;
        
      case 'delete':
        newContent = document.content.slice(0, operation.position) + 
                    document.content.slice(operation.position + (operation.length || 0));
        break;
        
      case 'retain':
        // No content change, just move the position
        pos = operation.position + (operation.length || 0);
        if (pos > document.content.length) {
          throw new Error('Retain operation out of bounds');
        }
        return; // No need to update the document
    }

    // Update document state
    document.content = newContent;
    document.version++;
    document.operations.push(operation);
    
    // Keep operation history (with a limit to prevent memory issues)
    const history = this.operationHistory.get(docId) || [];
    history.push(operation);
    if (history.length > 1000) { // Keep last 1000 operations
      this.operationHistory.set(docId, history.slice(-1000));
    } else {
      this.operationHistory.set(docId, history);
    }
  }

  private transformOperation(op1: DocumentOperation, op2: DocumentOperation): DocumentOperation {
    // Use the OT algorithm for proper transformation
    const [transformed] = this.ot.transform(op1, op2);
    return transformed as DocumentOperation;
  }

  getDocumentState(docId: string, clientId: string): { content: string; version: number } | null {
    const document = this.documents.get(docId);
    if (!document) return null;
    
    this.clientVersions.set(clientId, document.version);
    
    return {
      content: document.content,
      version: document.version,
    };
  }

  getOperationHistory(docId: string, fromVersion: number): DocumentOperation[] {
    const document = this.documents.get(docId);
    if (!document) return [];
    
    return document.operations.slice(fromVersion);
  }

  getDocument(docId: string): DocumentState | null {
    return this.documents.get(docId) || null;
  }

  // Cleanup old operations to prevent memory leaks
  cleanup(docId: string): void {
    const document = this.documents.get(docId);
    if (document && document.operations.length > 1000) {
      // Keep only last 1000 operations
      document.operations = document.operations.slice(-1000);
    }
  }

  // Periodic cleanup for all documents
  startPeriodicCleanup(): void {
    setInterval(() => {
      for (const [docId] of this.documents) {
        this.cleanup(docId);
      }
    }, 60000); // Every minute
  }

  // Auto-save documents periodically
  startAutoSave(): void {
    setInterval(async () => {
      for (const [docId, document] of this.documents) {
        // Only save if document has been modified (version > 0)
        if (document.version > 0) {
          try {
            // Get owner from first operation or use default
            const ownerId = document.operations[0]?.userId || 'system';
            await documentPersistenceService.autoSave(
              docId,
              document.content,
              document.version,
              ownerId
            );
          } catch (error) {
            console.error(`Error auto-saving document ${docId}:`, error);
          }
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Delete a document
  deleteDocument(docId: string): boolean {
    const deleted = this.documents.delete(docId);
    this.operationHistory.delete(docId);
    return deleted;
  }

  // Get all document IDs
  getAllDocumentIds(): string[] {
    return Array.from(this.documents.keys());
  }
}

export const documentService = new DocumentService();

// Start periodic cleanup and auto-save
documentService.startPeriodicCleanup();
documentService.startAutoSave();
