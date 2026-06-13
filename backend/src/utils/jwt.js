/**
 * JWT utility - sign and verify JSON Web Tokens.
 * Token payload: { adminId, username, role }
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign a JWT token for an admin user.
 * @param {Object} payload - { adminId, username, role }
 * @returns {string} Signed JWT token
 */
exports.sign = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token.
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
exports.verify = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
