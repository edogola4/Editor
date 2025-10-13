import { describe, it, expect, beforeEach } from 'vitest';
import { OTAlgorithm } from '../../../src/ot/OTAlgorithm';
import { Operation } from '../../../src/ot/types';

describe('OTAlgorithm - Edge Cases', () => {
  let ot: OTAlgorithm;

  beforeEach(() => {
    ot = new OTAlgorithm();
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent inserts at the same position', () => {
      const doc = 'hello';
      const op1: Operation = { type: 'insert', position: 5, text: ' world' };
      const op2: Operation = { type: 'insert', position: 5, text: ' there' };
      
      // Apply op1 then transform op2 against op1
      const [op2Prime] = ot.transform(op1, op2);
      
      // Apply operations
      const afterOp1 = ot.applyOperation(doc, op1);
      const finalDoc = ot.applyOperation(afterOp1, op2Prime);
      
      expect(finalDoc).toBe('hello world there');
    });

    it('should handle insert and delete at the same position', () => {
      const doc = 'hello world';
      const insertOp: Operation = { type: 'insert', position: 5, text: ' beautiful' };
      const deleteOp: Operation = { type: 'delete', position: 5, length: 6 };
      
      // Transform deleteOp against insertOp
      const [_, deleteOpPrime] = ot.transform(insertOp, deleteOp);
      
      // Apply operations in different orders
      const result1 = ot.applyOperation(ot.applyOperation(doc, insertOp), deleteOpPrime);
      const result2 = ot.applyOperation(ot.applyOperation(doc, deleteOp), insertOp);
      
      // Should be the same regardless of operation order
      expect(result1).toBe('hello beautiful');
      expect(result2).toBe('hello beautiful');
    });
  });

  describe('Complex Transformations', () => {
    it('should handle multiple overlapping operations', () => {
      const doc = 'The quick brown fox';
      
      // User A: Insert 'lazy ' before 'brown'
      const opA: Operation = { type: 'insert', position: 10, text: 'lazy ' };
      
      // User B: Delete 'quick '
      const opB: Operation = { type: 'delete', position: 4, length: 6 };
      
      // Transform operations against each other
      const [opAPrime, opBPrime] = ot.transform(opA, opB);
      
      // Apply operations in different orders
      const result1 = ot.applyOperation(ot.applyOperation(doc, opA), opBPrime);
      const result2 = ot.applyOperation(ot.applyOperation(doc, opB), opAPrime);
      
      // Should converge to the same result
      expect(result1).toBe('The lazy brown fox');
      expect(result2).toBe('The lazy brown fox');
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle operations at the beginning of the document', () => {
      const doc = 'hello';
      const op1: Operation = { type: 'insert', position: 0, text: 'say ' };
      const op2: Operation = { type: 'delete', position: 0, length: 1 };
      
      const [op2Prime] = ot.transform(op1, op2);
      
      const result = ot.applyOperation(ot.applyOperation(doc, op1), op2Prime);
      expect(result).toBe('say ello');
    });

    it('should handle operations at the end of the document', () => {
      const doc = 'hello';
      const op1: Operation = { type: 'insert', position: 5, text: ' world' };
      const op2: Operation = { type: 'delete', position: 4, length: 1 };
      
      const [op1Prime] = ot.transform(op2, op1);
      
      const result = ot.applyOperation(ot.applyOperation(doc, op2), op1Prime);
      expect(result).toBe('hell world');
    });
  });

  describe('Performance', () => {
    it('should handle large documents efficiently', () => {
      // Create a large document (100,000 characters)
      const largeText = 'x'.repeat(100000);
      const doc = largeText;
      
      // Time the operation
      const start = performance.now();
      const op: Operation = { type: 'insert', position: 50000, text: 'test' };
      const result = ot.applyOperation(doc, op);
      const duration = performance.now() - start;
      
      expect(result.length).toBe(100004);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle many concurrent operations', () => {
      let doc = '';
      const operations: Operation[] = [];
      const numOperations = 1000;
      
      // Generate many insert operations
      for (let i = 0; i < numOperations; i++) {
        operations.push({
          type: 'insert',
          position: i,
          text: i.toString()
        });
      }
      
      // Apply all operations
      const start = performance.now();
      for (const op of operations) {
        doc = ot.applyOperation(doc, op);
      }
      const duration = performance.now() - start;
      
      expect(doc.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
