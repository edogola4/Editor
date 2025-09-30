/**
 * Client-side Operational Transformation (OT) implementation
 * Handles concurrent editing with conflict resolution
 */

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string;
  length?: number;
  version: number;
  clientId: string;
  timestamp: number;
  userId?: string;
}

export class ClientOT {
  private pendingOperations: Operation[] = [];
  private serverVersion: number = 0;
  private clientVersion: number = 0;

  /**
   * Apply an operation to a document string
   */
  applyOperation(doc: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return (
          doc.slice(0, operation.position) +
          (operation.text || '') +
          doc.slice(operation.position)
        );

      case 'delete':
        return (
          doc.slice(0, operation.position) +
          doc.slice(operation.position + (operation.length || 0))
        );

      case 'retain':
        // No change to document content
        return doc;

      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  /**
   * Transform two operations that occurred concurrently
   */
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    const transformedOp1 = { ...op1 };
    const transformedOp2 = { ...op2 };

    // If operations are at the same position
    if (op1.position === op2.position) {
      if (op1.type === 'insert' && op2.type === 'insert') {
        // Both inserts at same position - shift one to the right
        // Use timestamp to determine order
        if (op1.timestamp < op2.timestamp) {
          transformedOp2.position = op2.position + (op1.text?.length || 0);
        } else {
          transformedOp1.position = op1.position + (op2.text?.length || 0);
        }
      } else if (op1.type === 'insert' && op2.type === 'delete') {
        // Insert and delete at same position - delete should happen first
        transformedOp1.position = op1.position + (op2.length || 0);
      } else if (op1.type === 'delete' && op2.type === 'insert') {
        // Delete and insert at same position - insert should happen first
        transformedOp2.position = op2.position + (op1.length || 0);
      }
    }
    // If operations don't overlap
    else if (op1.position + (op1.length || 0) <= op2.position) {
      // op1 comes before op2
      if (op1.type === 'insert') {
        transformedOp2.position = op2.position + (op1.text?.length || 0);
      } else if (op1.type === 'delete') {
        const deleteLength = op1.length || 0;
        if (op2.position > op1.position) {
          transformedOp2.position = Math.max(op2.position - deleteLength, 0);
        }
      }
    } else if (op2.position + (op2.length || 0) <= op1.position) {
      // op2 comes before op1
      if (op2.type === 'insert') {
        transformedOp1.position = op1.position + (op2.text?.length || 0);
      } else if (op2.type === 'delete') {
        const deleteLength = op2.length || 0;
        if (op1.position > op2.position) {
          transformedOp1.position = Math.max(op1.position - deleteLength, 0);
        }
      }
    }

    return [transformedOp1, transformedOp2];
  }

  /**
   * Add operation to pending queue
   */
  addPendingOperation(operation: Operation): void {
    this.pendingOperations.push(operation);
  }

  /**
   * Handle incoming server operation
   * Transform against all pending operations
   */
  handleServerOperation(serverOp: Operation): Operation {
    let transformedOp = { ...serverOp };

    // Transform against all pending operations
    for (const pendingOp of this.pendingOperations) {
      const [, transformed] = this.transform(pendingOp, transformedOp);
      transformedOp = transformed;
    }

    this.serverVersion = serverOp.version;
    return transformedOp;
  }

  /**
   * Acknowledge server received our operation
   * Remove from pending queue
   */
  acknowledgeOperation(operation: Operation): void {
    const index = this.pendingOperations.findIndex(
      (op) => op.clientId === operation.clientId && op.timestamp === operation.timestamp
    );
    
    if (index !== -1) {
      this.pendingOperations.splice(index, 1);
    }
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.pendingOperations.length;
  }

  /**
   * Clear all pending operations
   */
  clearPending(): void {
    this.pendingOperations = [];
  }

  /**
   * Get server version
   */
  getServerVersion(): number {
    return this.serverVersion;
  }

  /**
   * Set server version
   */
  setServerVersion(version: number): void {
    this.serverVersion = version;
  }

  /**
   * Get client version
   */
  getClientVersion(): number {
    return this.clientVersion;
  }

  /**
   * Increment client version
   */
  incrementClientVersion(): void {
    this.clientVersion++;
  }

  /**
   * Create an insert operation
   */
  createInsertOperation(
    position: number,
    text: string,
    clientId: string,
    userId?: string
  ): Operation {
    return {
      type: 'insert',
      position,
      text,
      version: this.serverVersion,
      clientId,
      timestamp: Date.now(),
      userId,
    };
  }

  /**
   * Create a delete operation
   */
  createDeleteOperation(
    position: number,
    length: number,
    clientId: string,
    userId?: string
  ): Operation {
    return {
      type: 'delete',
      position,
      length,
      version: this.serverVersion,
      clientId,
      timestamp: Date.now(),
      userId,
    };
  }

  /**
   * Compose two operations into one
   */
  compose(op1: Operation, op2: Operation): string {
    // Apply op2 after op1
    let doc = this.applyOperation('', op1);
    return this.applyOperation(doc, op2);
  }
}

// Export singleton instance
export const clientOT = new ClientOT();
