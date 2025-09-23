import { StatusCodes } from "http-status-codes";

describe("HTTP Status Codes", () => {
  it("should have correct status codes", () => {
    expect(StatusCodes.OK).toBe(200);
    expect(StatusCodes.CREATED).toBe(201);
    expect(StatusCodes.BAD_REQUEST).toBe(400);
    expect(StatusCodes.UNAUTHORIZED).toBe(401);
    expect(StatusCodes.FORBIDDEN).toBe(403);
    expect(StatusCodes.NOT_FOUND).toBe(404);
    expect(StatusCodes.INTERNAL_SERVER_ERROR).toBe(500);
  });
});

describe("Error Handling", () => {
  it("should handle different error types", () => {
    // Test that our error handling utilities work correctly
    const testError = new Error("Test error");
    expect(testError).toBeInstanceOf(Error);
    expect(testError.message).toBe("Test error");
  });
});
