const { DatabaseConnectionError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../utils/customErrors');
const { RErrorMessage, _getCodeMessage } = require('../../../utils/javascript/message');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Add JWT error handling
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new UnauthorizedError(message);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new UnauthorizedError(message);
  }

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

  // Use RErrorMessage utility for consistent error formatting
  if (error instanceof DatabaseConnectionError || err instanceof DatabaseConnectionError) {
    const dbError = error instanceof DatabaseConnectionError ? error : err;
    console.error(`[${new Date().toISOString()}] [ERROR] DatabaseConnectionError - Status: ${dbError.statusCode}, Message: ${dbError.message}`);
    const errorResponse = new RErrorMessage(dbError.message, dbError.statusCode);
    const [json, status] = errorResponse.get();
    return res.status(status).json({
      ...json,
      status: dbError.statusCode
    });
  }

  if (error instanceof ValidationError || err instanceof ValidationError) {
    const validationError = error instanceof ValidationError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] ValidationError - Status: ${validationError.statusCode}, Message: ${validationError.message}`);
    const errorResponse = new RErrorMessage(validationError.message, validationError.statusCode);
    const [json, status] = errorResponse.get();
    return res.status(status).json({
      ...json,
      status: validationError.statusCode
    });
  }

  if (error instanceof NotFoundError || err instanceof NotFoundError) {
    const notFoundError = error instanceof NotFoundError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] NotFoundError - Status: ${notFoundError.statusCode}, Message: ${notFoundError.message}`);
    const errorResponse = new RErrorMessage(notFoundError.message, notFoundError.statusCode);
    const [json, status] = errorResponse.get();
    return res.status(status).json({
      ...json,
      status: notFoundError.statusCode
    });
  }

  if (error instanceof UnauthorizedError || err instanceof UnauthorizedError) {
    const unauthorizedError = error instanceof UnauthorizedError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] UnauthorizedError - Status: ${unauthorizedError.statusCode}, Message: ${unauthorizedError.message}`);
    const errorResponse = new RErrorMessage(unauthorizedError.message, unauthorizedError.statusCode);
    const [json, status] = errorResponse.get();
    return res.status(status).json({
      ...json,
      status: unauthorizedError.statusCode
    });
  }

  if (error instanceof ForbiddenError || err instanceof ForbiddenError) {
    const forbiddenError = error instanceof ForbiddenError ? error : err;
    console.log(`[${new Date().toISOString()}] [WARN] ForbiddenError - Status: ${forbiddenError.statusCode}, Message: ${forbiddenError.message}`);
    const errorResponse = new RErrorMessage(forbiddenError.message, forbiddenError.statusCode);
    const [json, status] = errorResponse.get();
    return res.status(status).json({
      ...json,
      status: forbiddenError.statusCode
    });
  }

  // Unhandled errors
  console.error(`[${new Date().toISOString()}] [ERROR] Unhandled error - Status: ${error.statusCode || 500}, Message: ${error.message || 'An unexpected error occurred'}, Stack: ${err.stack}`);
  const statusCode = error.statusCode || 500;
  const errorResponse = new RErrorMessage(error.message || 'An unexpected error occurred', statusCode);
  const [json, status] = errorResponse.get();
  return res.status(status).json({
    ...json,
    status: statusCode
  });
};

module.exports = errorHandler;
