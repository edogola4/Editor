export class CustomError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  static badRequest(message: string = "Bad Request", errors?: any[]) {
    return new CustomError(message, 400, errors);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new CustomError(message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new CustomError(message, 403);
  }

  static notFound(message: string = "Not Found") {
    return new CustomError(message, 404);
  }

  static conflict(message: string = "Conflict") {
    return new CustomError(message, 409);
  }

  static internal(message: string = "Internal Server Error") {
    return new CustomError(message, 500);
  }

  static fromSequelizeValidationError(error: any) {
    const errors = error.errors.map((err: any) => ({
      message: err.message,
      type: err.type,
      path: err.path,
      value: err.value,
    }));
    return new CustomError("Validation Error", 400, errors);
  }
}
