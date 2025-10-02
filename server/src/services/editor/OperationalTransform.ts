import { Operation, DocumentState } from '../../types/editor.types';

export class OperationalTransform {
  // Apply a single operation to a document
  static applyOperation(document: string, operation: Operation): string {
    if (operation.type === 'insert') {
      return document.slice(0, operation.position) + operation.text + document.slice(operation.position);
    } else if (operation.type === 'delete') {
      return document.slice(0, operation.position) + document.slice(operation.position + (operation.length || 0));
    }
    return document;
  }

  // Transform operation against another operation (for conflict resolution)
  static transform(op1: Operation, op2: Operation): Operation[] {
    if (op1.type === 'retain' || op2.type === 'retain') {
      return [op1];
    }

    // Both operations are inserts at the same position
    if (op1.type === 'insert' && op2.type === 'insert' && op1.position === op2.position) {
      // Order by user ID for consistency
      return op1.userId < op2.userId 
        ? [op1, { ...op2, position: op2.position + (op1.text?.length || 0) }]
        : [{ ...op1, position: op1.position + (op2.text?.length || 0) }, op2];
    }

    // Insert vs Delete
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [op1, { ...op2, position: op2.position + (op1.text?.length || 0) }];
      } else {
        return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
      }
    }

    // Delete vs Insert
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
      } else {
        return [{ ...op1, position: op1.position + (op2.text?.length || 0) }, op2];
      }
    }

    // Delete vs Delete
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position === op2.position) {
        // Same position, order by length (longer delete first)
        return (op1.length || 0) >= (op2.length || 0) ? [op1, { ...op2, length: 0 }] : [{ ...op1, length: 0 }, op2];
      } else if (op1.position < op2.position) {
        return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
      } else {
        return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
      }
    }

    return [op1];
  }

  // Compose multiple operations into a single operation
  static compose(operations: Operation[]): Operation[] {
    if (operations.length <= 1) return operations;

    const composed: Operation[] = [];
    let current = operations[0];

    for (let i = 1; i < operations.length; i++) {
      const next = operations[i];
      const transformed = this.transform(current, next);
      
      if (transformed.length === 2) {
        composed.push(transformed[0]);
        current = transformed[1];
      } else {
        current = transformed[0];
      }
    }

    composed.push(current);
    return composed;
  }

  // Rebase a client's operations against server operations
  static rebase(clientOps: Operation[], serverOps: Operation[]): Operation[] {
    const rebased: Operation[] = [];
    
    for (const clientOp of clientOps) {
      let transformedOp = clientOp;
      
      for (const serverOp of serverOps) {
        const [op1] = this.transform(transformedOp, serverOp);
        transformedOp = op1;
      }
      
      rebased.push(transformedOp);
    }
    
    return rebased;
  }
}
