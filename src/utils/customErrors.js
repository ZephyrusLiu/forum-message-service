class DatabaseConnectionError extends Error {
  constructor(message = 'Database connection failed') {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.statusCode = 503;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends Error {
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  DatabaseConnectionError,
  ValidationError,
  NotFoundError
};
