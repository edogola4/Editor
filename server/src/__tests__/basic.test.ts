import { describe, it, expect } from 'vitest';

describe("Basic Test Suite", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    expect("hello".length).toBe(5);
    expect("hello world".split(" ").length).toBe(2);
  });

  it("should handle array operations", () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });
});
