/**
 * JWT Authentication Middleware.
 * Verifies the Bearer token from Authorization header,
 * checks against Redis blacklist (for logged-out tokens),
 * and attaches admin info to req.admin.
 */
const crypto = require('crypto');
const jwtUtil = require('../utils/jwt');
const redis = require('../config/redis');
const response = require('../utils/response');

/**
 * Generate a unique hash for a JWT token (used for blacklist).
 * Uses SHA-256 so every token gets a unique blacklist key,
 * unlike the old approach which collided because all JWTs share the same header.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Authenticate request via JWT Bearer token.
 * Attaches req.admin = { id, username, role } on success.
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.error(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted (logged out)
    const tokenHash = hashToken(token);
    const blacklisted = await redis.get(`blacklist:${tokenHash}`);
    if (blacklisted) {
      return response.error(res, 'Token has been invalidated. Please login again.', 401);
    }

    // Verify JWT signature and expiration
    const decoded = jwtUtil.verify(token);

    // Attach admin info for downstream use
    req.admin = {
      id: decoded.adminId,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return response.error(res, 'Token has expired. Please login again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return response.error(res, 'Invalid token', 401);
    }
    next(err);
  }
}

module.exports = auth;
