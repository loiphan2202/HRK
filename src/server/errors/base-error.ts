export class BaseError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public type: string = 'BaseError'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NotFoundError');
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string = 'Bad request') {
    super(400, message, 'BadRequestError');
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UnauthorizedError');
  }
}

export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed') {
    super(400, message, 'ValidationError');
  }
}