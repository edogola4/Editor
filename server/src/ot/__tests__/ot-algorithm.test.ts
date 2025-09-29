import { describe, it, expect, beforeEach } from 'vitest';
import { OT } from '../ot-core';

describe('Operational Transform Algorithm', () => {
  let ot: OT;

  beforeEach(() => {
    ot = new OT();
  });

  describe('Basic Operations', () => {
    it('should handle insert operations', () => {
      const doc = '';
      const op = { type: 'insert', position: 0, text: 'Hello' };
      const result = ot.applyOperation(doc, op);
      expect(result).toBe('Hello');
    });

    it('should handle delete operations', () => {
      const doc = 'Hello';
      const op = { type: 'delete', position: 0, length: 1 };
      const result = ot.applyOperation(doc, op);
      expect(result).toBe('ello');
    });

    it('should handle retain operations', () => {
      const doc = 'Hello';
      const op = { type: 'retain', position: 0, length: 5 };
      const result = ot.applyOperation(doc, op);
      expect(result).toBe('Hello');
    });
  });

  describe('Concurrent Operations', () => {
    it('should transform insert-insert operations correctly', () => {
      const op1 = { type: 'insert', position: 0, text: 'A' };
      const op2 = { type: 'insert', position: 0, text: 'B' };
      
      const [transformedOp1, transformedOp2] = ot.transform(op1, op2);
      
      expect(transformedOp1.position).toBe(1); // B was inserted before A
      expect(transformedOp2.position).toBe(0);
    });

    it('should transform insert-delete operations correctly', () => {
      const insertOp = { type: 'insert', position: 0, text: 'X' };
      const deleteOp = { type: 'delete', position: 0, length: 1 };
      
      const [transformedInsert, transformedDelete] = ot.transform(insertOp, deleteOp);
      
      expect(transformedInsert.position).toBe(0);
      expect(transformedDelete.position).toBe(1); // Delete should skip the inserted character
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations at document boundaries', () => {
      const doc = 'Test';
      const op = { type: 'insert', position: 4, text: '!' };
      const result = ot.applyOperation(doc, op);
      expect(result).toBe('Test!');
    });

    it('should throw for invalid positions', () => {
      const doc = 'Test';
      const op = { type: 'insert', position: 10, text: 'X' };
      expect(() => ot.applyOperation(doc, op)).toThrow();
    });
  });
});
