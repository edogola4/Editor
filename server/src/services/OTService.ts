import { Operation } from 'ottypes';

/**
 * Operational Transform Service for handling concurrent editing conflicts
 */
export class OTService {
  /**
   * Transform an operation against another operation that happened concurrently
   * @param operation The operation to transform
   * @param against The operation to transform against
   * @returns A new operation that has been transformed
   */
  transform(operation: Operation, against: Operation): Operation {
    if (operation.length === 0) return operation;
    if (against.length === 0) return operation;

    // Handle different operation types
    if (Array.isArray(operation[0]) && Array.isArray(against[0])) {
      // Both operations are retain operations
      return this.transformRetain(operation as number[], against as number[]);
    } else if (typeof operation[0] === 'number' && typeof against[0] === 'number') {
      // Both operations are retain operations (compatibility)
      return this.transformRetain(operation as number[], against as number[]);
    } else if (typeof operation[0] === 'string' && typeof against[0] === 'string') {
      // Both operations are insert operations
      return this.transformInsert(operation as string[], against as string[]);
    } else if (typeof operation[0] === 'number' && typeof against[0] === 'string') {
      // Operation is retain, against is insert
      return this.transformRetainAgainstInsert(operation as number[], against as string[]);
    } else if (typeof operation[0] === 'string' && typeof against[0] === 'number') {
      // Operation is insert, against is retain
      return this.transformInsertAgainstRetain(operation as string[], against as number[]);
    }

    return operation;
  }

  /**
   * Transform a retain operation against another retain operation
   */
  private transformRetain(op1: number[], op2: number[]): Operation {
    // Retain operations don't affect each other
    return op1;
  }

  /**
   * Transform an insert operation against another insert operation
   */
  private transformInsert(op1: string[], op2: string[]): Operation {
    // If both are inserts at the same position, order by client ID or timestamp
    // For simplicity, we'll just keep the original operation
    return op1;
  }

  /**
   * Transform a retain operation against an insert operation
   */
  private transformRetainAgainstInsert(retainOp: number[], insertOp: string[]): Operation {
    // If the insert is before the retain, we need to shift the retain
    if (insertOp[0].length <= retainOp[0]) {
      return [retainOp[0] + insertOp[0].length];
    }
    return retainOp;
  }

  /**
   * Transform an insert operation against a retain operation
   */
  private transformInsertAgainstRetain(insertOp: string[], retainOp: number[]): Operation {
    // If the retain is before the insert, no transformation needed
    if (retainOp[0] > 0) {
      return insertOp;
    }
    // If the retain is at the same position, order by client ID or timestamp
    // For simplicity, we'll just keep the original operation
    return insertOp;
  }

  /**
   * Compose two operations into a single operation
   */
  compose(op1: Operation, op2: Operation): Operation {
    // If either operation is empty, return the other
    if (!op1 || op1.length === 0) return op2;
    if (!op2 || op2.length === 0) return op1;

    // If both operations are retains, combine them
    if (typeof op1[0] === 'number' && typeof op2[0] === 'number') {
      return [op1[0] + (op2[0] as number)];
    }

    // If first is retain and second is insert, keep both
    if (typeof op1[0] === 'number' && typeof op2[0] === 'string') {
      return [...op1, ...op2];
    }

    // If first is insert and second is retain, keep both
    if (typeof op1[0] === 'string' && typeof op2[0] === 'number') {
      return [...op1, ...op2];
    }

    // If both are inserts, combine them
    if (typeof op1[0] === 'string' && typeof op2[0] === 'string') {
      return [op1[0] + op2[0]];
    }

    // Default case: keep both operations
    return [...op1, ...op2];
  }

  /**
   * Apply an operation to a string
   */
  applyOperation(content: string, operation: Operation): string {
    if (!operation || operation.length === 0) return content;

    let result = '';
    let index = 0;

    for (const op of operation) {
      if (typeof op === 'number') {
        // Retain operation
        if (index + op > content.length) {
          throw new Error('Operation goes beyond document length');
        }
        result += content.slice(index, index + op);
        index += op;
      } else if (typeof op === 'string') {
        // Insert operation
        result += op;
      } else if (op && typeof op === 'object' && 'delete' in op) {
        // Delete operation
        index += op.delete;
      } else if (Array.isArray(op)) {
        // Nested operation (for more complex operations)
        // This is a simplified implementation
        result += op.join('');
      }
    }

    // Add any remaining content
    if (index < content.length) {
      result += content.slice(index);
    }

    return result;
  }

  /**
   * Invert an operation
   */
  invert(operation: Operation, content: string): Operation {
    const inverted: Operation = [];
    let index = 0;

    for (const op of operation) {
      if (typeof op === 'number') {
        // Retain: keep as is
        inverted.push(op);
        index += op;
      } else if (typeof op === 'string') {
        // Insert: turn into delete
        inverted.push({ delete: op.length });
      } else if (op && typeof op === 'object' && 'delete' in op) {
        // Delete: turn into insert of the deleted text
        inverted.push(content.slice(index, index + op.delete));
        index += op.delete;
      } else if (Array.isArray(op)) {
        // Nested operation: recursively invert
        const nestedInverted = this.invert(op, content.slice(index, index + op.length));
        inverted.push(nestedInverted);
        index += op.length;
      }
    }

    return inverted;
  }

  /**
   * Transform cursor position based on an operation
   */
  transformCursorPosition(
    cursor: { row: number; column: number },
    operation: Operation,
    isOwnOperation: boolean = false
  ): { row: number; column: number } {
    // This is a simplified implementation
    // A real implementation would need to handle more complex cases
    if (operation.length === 0) return cursor;

    const { row, column } = cursor;
    let newRow = row;
    let newColumn = column;

    for (const op of operation) {
      if (typeof op === 'number') {
        // Retain: move cursor forward if it's after the operation
        const lines = op.toString().split('\n');
        if (lines.length > 1) {
          newRow += lines.length - 1;
          newColumn = lines[lines.length - 1].length;
        } else {
          newColumn += op;
        }
      } else if (typeof op === 'string') {
        // Insert: move cursor forward if it's at or after the insert position
        const lines = op.split('\n');
        if (lines.length > 1) {
          newRow += lines.length - 1;
          newColumn = lines[lines.length - 1].length;
        } else {
          newColumn += op.length;
        }
      } else if (op && typeof op === 'object' && 'delete' in op) {
        // Delete: move cursor backward if it's after the deleted text
        const lines = op.delete.toString().split('\n');
        if (lines.length > 1) {
          newRow = Math.max(0, newRow - (lines.length - 1));
          // This is a simplification - actual implementation would be more complex
          newColumn = Math.max(0, newColumn - lines[lines.length - 1].length);
        } else {
          newColumn = Math.max(0, newColumn - op.delete);
        }
      }
    }

    return { row: newRow, column: newColumn };
  }
}
