const logger = require('../utils/logger');
const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return error(res, 'Validation failed', 400, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} already exists`, 409);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') return error(res, 'Invalid token', 401);
  if (err.name === 'TokenExpiredError')  return error(res, 'Token expired', 401);

  // Default
  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : 'Internal server error';
  return error(res, message, statusCode);
};

module.exports = errorHandler;
