/**
 * Unified JSON response helpers.
 * All API responses follow this format:
 *   Success: { code: 200, data: {...}, message: "ok" }
 *   Paginated: { code: 200, data: { list, total, page, pageSize }, message: "ok" }
 *   Error: { code: 4xx/5xx, message: "error description" }
 */

/**
 * Send a success response.
 * @param {Response} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional message
 * @param {number} statusCode - HTTP status code (default 200)
 */
exports.success = (res, data = null, message = 'ok', statusCode = 200) => {
  return res.status(statusCode).json({
    code: statusCode,
    data,
    message,
  });
};

/**
 * Send a paginated response.
 * @param {Response} res - Express response object
 * @param {Array} list - List of items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} pageSize - Items per page
 */
exports.paginated = (res, list, total, page, pageSize) => {
  return res.status(200).json({
    code: 200,
    data: { list, total, page, pageSize },
    message: 'ok',
  });
};

/**
 * Send an error response.
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
exports.error = (res, message = 'Internal Server Error', statusCode = 500) => {
  return res.status(statusCode).json({
    code: statusCode,
    message,
  });
};
