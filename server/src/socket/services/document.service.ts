import { DocumentOperation } from '../types/events';

type DocumentState = {
  content: string;
  version: number;
  operations: DocumentOperation[];
};

export class DocumentService {
  private documents: Map<string, DocumentState> = new Map();
  private operationHistory: Map<string, DocumentOperation[]> = new Map();
  private clientVersions: Map<string, number> = new Map(); // clientId -> version

  createDocument(docId: string, initialContent: string = ''): void {
    this.documents.set(docId, {
      content: initialContent,
      version: 0,
      operations: [],
    });
    this.operationHistory.set(docId, []);
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
    // This is a simplified version - you'll need to implement the full OT transformation rules
    // based on your specific requirements
    
    // If operations are in different positions, they don't affect each other
    if (op1.position + (op1.length || 0) <= op2.position) {
      return op1;
    }
    
    if (op2.position + (op2.length || 0) <= op1.position) {
      return {
        ...op1,
        position: op1.position + (op2.type === 'insert' ? op2.text?.length || 0 : 0) -
                            (op2.type === 'delete' ? op2.length || 0 : 0),
      };
    }
    
    // Handle overlapping operations (simplified)
    // In a real implementation, you'd need more sophisticated conflict resolution
    return op1; // For now, just return the original operation
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
}

export const documentService = new DocumentService();
