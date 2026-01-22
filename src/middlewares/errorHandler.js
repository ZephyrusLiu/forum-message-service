const { DatabaseConnectionError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../utils/customErrors');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err instanceof SyntaxError || err.name === 'SyntaxError') {
    const message = 'Invalid JSON format in request body';
    error = new ValidationError(message);
    error.statusCode = 400;
  }

  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new ValidationError(message);
  }

  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ValidationError(message);
  }

  if (error instanceof DatabaseConnectionError || err instanceof DatabaseConnectionError) {
    const dbError = error instanceof DatabaseConnectionError ? error : err;
    console.error(`[${new Date().toISOString()}] [ERROR] DatabaseConnectionError - Status: ${dbError.statusCode}, Message: ${dbError.message}`);
    return res.status(dbError.statusCode).json({
      error: 'Database Error',
      message: dbError.message,
      status: dbError.statusCode
    });
  }

  if (error instanceof ValidationError || err instanceof ValidationError) {
    const validationError = error instanceof ValidationError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] ValidationError - Status: ${validationError.statusCode}, Message: ${validationError.message}`);
    return res.status(validationError.statusCode).json({
      error: 'Validation Failed',
      message: validationError.message,
      status: validationError.statusCode
    });
  }

  if (error instanceof NotFoundError || err instanceof NotFoundError) {
    const notFoundError = error instanceof NotFoundError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] NotFoundError - Status: ${notFoundError.statusCode}, Message: ${notFoundError.message}`);
    return res.status(notFoundError.statusCode).json({
      error: 'Not Found',
      message: notFoundError.message,
      status: notFoundError.statusCode
    });
  }

  if (error instanceof UnauthorizedError || err instanceof UnauthorizedError) {
    const unauthorizedError = error instanceof UnauthorizedError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] UnauthorizedError - Status: ${unauthorizedError.statusCode}, Message: ${unauthorizedError.message}`);
    return res.status(unauthorizedError.statusCode).json({
      error: 'Unauthorized',
      message: unauthorizedError.message,
      status: unauthorizedError.statusCode
    });
  }

  if (error instanceof ForbiddenError || err instanceof ForbiddenError) {
    const forbiddenError = error instanceof ForbiddenError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] ForbiddenError - Status: ${forbiddenError.statusCode}, Message: ${forbiddenError.message}`);
    return res.status(forbiddenError.statusCode).json({
      error: 'Forbidden',
      message: forbiddenError.message,
      status: forbiddenError.statusCode
    });
  }

  console.error(`[${new Date().toISOString()}] [ERROR] Unhandled error - Status: ${error.statusCode || 500}, Message: ${error.message || 'An unexpected error occurred'}, Stack: ${err.stack}`);

  res.status(error.statusCode || 500).json({
    error: 'Server Error',
    message: error.message || 'An unexpected error occurred',
    status: error.statusCode || 500
  });
};

module.exports = errorHandler;
