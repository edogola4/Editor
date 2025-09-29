class OT {
  /**
   * Apply an operation to a document string
   */
  applyOperation(doc, operation) {
    switch (operation.type) {
      case 'insert':
        return doc.slice(0, operation.position) +
               (operation.text || '') +
               doc.slice(operation.position);

      case 'delete':
        return doc.slice(0, operation.position) +
               doc.slice(operation.position + (operation.length || 0));

      case 'retain':
        // No change to document content
        return doc;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Transform two operations that occurred concurrently
   */
  transform(op1, op2) {
    // Simple transformation logic - in a real OT implementation,
    // this would be much more sophisticated

    const transformedOp1 = { ...op1 };
    const transformedOp2 = { ...op2 };

    // If operations are at the same position
    if (op1.position === op2.position) {
      if (op1.type === 'insert' && op2.type === 'insert') {
        // Both inserts at same position - shift one to the right
        transformedOp1.position = op1.position + (op2.text?.length || 0);
      } else if (op1.type === 'insert' && op2.type === 'delete') {
        // Insert and delete at same position - delete should happen first
        transformedOp2.position = op2.position + (op1.text?.length || 0);
      } else if (op1.type === 'delete' && op2.type === 'insert') {
        // Delete and insert at same position - insert should happen first
        transformedOp1.position = op1.position + (op2.text?.length || 0);
      }
    }
    // If operations don't overlap, no transformation needed
    else if (op1.position + (op1.length || 0) <= op2.position) {
      // op1 comes before op2
      if (op1.type === 'insert') {
        transformedOp2.position = op2.position + (op1.text?.length || 0);
      } else if (op1.type === 'delete') {
        const deleteLength = (op1.length || 0);
        if (op2.position > op1.position) {
          transformedOp2.position = Math.max(op2.position - deleteLength, 0);
        }
      }
    } else if (op2.position + (op2.length || 0) <= op1.position) {
      // op2 comes before op1
      if (op2.type === 'insert') {
        transformedOp1.position = op1.position + (op2.text?.length || 0);
      } else if (op2.type === 'delete') {
        const deleteLength = (op2.length || 0);
        if (op1.position > op2.position) {
          transformedOp1.position = Math.max(op1.position - deleteLength, 0);
        }
      }
    }

    return [transformedOp1, transformedOp2];
  }

  /**
   * Compose two operations into one
   */
  compose(op1, op2) {
    // Simple composition - apply op2 after op1
    let doc = this.applyOperation('', op1);
    return this.applyOperation(doc, op2);
  }
}

export { OT }
