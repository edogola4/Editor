import { describe, it, expect, beforeEach } from 'vitest';
import { OTAlgorithm } from '../../../src/ot/OTAlgorithm';
import { Operation } from '../../../src/ot/types';

describe('OTAlgorithm', () => {
  let ot: OTAlgorithm;

  beforeEach(() => {
    ot = new OTAlgorithm();
  });

  describe('applyOperation', () => {
    it('should apply insert operation', () => {
      const doc = 'hello';
      const op: Operation = { type: 'insert', position: 5, text: ' world' };
      const result = ot.applyOperation(doc, op);
      expect(result).toBe('hello world');
    });

    it('should apply delete operation', () => {
      const doc = 'hello world';
      const op: Operation = { type: 'delete', position: 5, length: 6 };
      const result = ot.applyOperation(doc, op);
      expect(result).toBe('hello');
    });
  });

  describe('transform', () => {
    it('should transform two insert operations', () => {
      const op1: Operation = { type: 'insert', position: 5, text: ' world' };
      const op2: Operation = { type: 'insert', position: 5, text: ' there' };
      const [op1Prime, op2Prime] = ot.transform(op1, op2);
      
      expect(op1Prime).toEqual({ type: 'insert', position: 5, text: ' world' });
      expect(op2Prime).toEqual({ type: 'insert', position: 11, text: ' there' });
    });

    it('should handle concurrent delete operations', () => {
      const op1: Operation = { type: 'delete', position: 5, length: 6 };
      const op2: Operation = { type: 'delete', position: 7, length: 4 };
      const [op1Prime, op2Prime] = ot.transform(op1, op2);
      
      // The operations should be adjusted to account for each other
      expect(op1Prime).toEqual({ type: 'delete', position: 5, length: 6 });
      expect(op2Prime).toEqual({ type: 'delete', position: 5, length: 4 });
    });
  });

  describe('compose', () => {
    it('should compose two insert operations', () => {
      const op1: Operation = { type: 'insert', position: 5, text: 'hello' };
      const op2: Operation = { type: 'insert', position: 10, text: ' world' };
      const composed = ot.compose(op1, op2);
      
      expect(composed).toHaveLength(2);
      expect(composed[0]).toEqual(op1);
      expect(composed[1]).toEqual(op2);
    });
  });
});
