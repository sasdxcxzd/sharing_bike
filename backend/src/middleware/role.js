/**
 * Role-Based Access Control Middleware.
 * Factory function that returns middleware checking if the
 * authenticated admin has one of the allowed roles.
 *
 * Usage: router.post('/bikes', auth, role('super_admin', 'operator'), createBike);
 */
const response = require('../utils/response');

/**
 * Create role-check middleware for the given allowed roles.
 * @param  {...string} allowedRoles - Roles that are permitted (e.g., 'super_admin', 'operator')
 * @returns {Function} Express middleware
 */
function role(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return response.error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return response.error(res, 'Insufficient permissions', 403);
    }

    next();
  };
}

module.exports = role;
