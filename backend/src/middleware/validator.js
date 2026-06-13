/**
 * Request validation middleware built on express-validator.
 * Validates req.body, req.params, and req.query against defined schemas.
 * Returns 422 with detailed errors on validation failure.
 */
const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results and returns
 * 422 with error details if validation fails.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(422).json({
      code: 422,
      message: 'Validation failed',
      errors: formatted,
    });
  }

  next();
}

module.exports = { validate };
