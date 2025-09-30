import { describe, it, expect } from 'vitest';
import { OT } from '../ot-core.js';

describe('Concurrent Editing', () => {
  const ot = new OT();
  
  it('should handle concurrent inserts at same position', () => {
    // User A inserts 'A' at position 0
    const opA = { 
      type: 'insert', 
      position: 0, 
      text: 'A',
      version: 1,
      clientId: 'client1',
      timestamp: Date.now()
    };
    
    // User B concurrently inserts 'B' at position 0
    const opB = {
      type: 'insert',
      position: 0,
      text: 'B',
      version: 1,
      clientId: 'client2',
      timestamp: Date.now() + 1 // Slightly later
    };
    
    // Transform operations
    const [opAPrime, opBPrime] = ot.transform(opA, opB);
    
    // Apply operations in different orders should give same result
    let doc = '';
    doc = ot.applyOperation(doc, opA);
    doc = ot.applyOperation(doc, opBPrime);
    
    let doc2 = '';
    doc2 = ot.applyOperation(doc2, opB);
    doc2 = ot.applyOperation(doc2, opAPrime);
    
    expect(doc).toBe('AB');
    expect(doc2).toBe('AB');
  });
  
  it('should handle overlapping deletes', () => {
    // Initial document
    let doc = 'Hello World';
    
    // User A deletes 'Hello'
    const opA = {
      type: 'delete',
      position: 0,
      length: 5,
      version: 1,
      clientId: 'client1',
      timestamp: Date.now()
    };
    
    // User B deletes 'World'
    const opB = {
      type: 'delete',
      position: 6,
      length: 5,
      version: 1,
      clientId: 'client2',
      timestamp: Date.now() + 1
    };
    
    // Transform operations
    const [opAPrime, opBPrime] = ot.transform(opA, opB);
    
    // Apply operations in different orders
    let doc1 = doc;
    doc1 = ot.applyOperation(doc1, opA);
    doc1 = ot.applyOperation(doc1, opBPrime);
    
    let doc2 = doc;
    doc2 = ot.applyOperation(doc2, opB);
    doc2 = ot.applyOperation(doc2, opAPrime);
    
    expect(doc1).toBe(' ');
    expect(doc2).toBe(' ');
  });
});
