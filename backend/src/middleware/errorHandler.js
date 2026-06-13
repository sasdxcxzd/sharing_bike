/**
 * Global Error Handling Middleware.
 * Catches all errors thrown or passed via next(err) and returns
 * a unified error response.
 */
const logger = require('../utils/logger');

/**
 * Global error handler. Must have 4 parameters.
 */
function errorHandler(err, req, res, _next) {
  logger.error(err.message, { stack: err.stack, url: req.originalUrl });

  // Known error types
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      code: 422,
      message: err.message || 'Validation failed',
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      code: 409,
      message: 'Duplicate entry - resource already exists',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      code: 400,
      message: 'Invalid JSON in request body',
    });
  }

  // Default: 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    code: statusCode,
    message,
  });
}

module.exports = errorHandler;
