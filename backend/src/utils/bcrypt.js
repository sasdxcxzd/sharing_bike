/**
 * Password hashing utility using bcryptjs.
 */
const bcrypt = require('bcryptjs');
const env = require('../config/env');

/**
 * Hash a plain-text password.
 * @param {string} password - Plain text password
 * @returns {Promise<string>} bcrypt hash
 */
exports.hash = async (password) => {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
};

/**
 * Compare a plain-text password with a bcrypt hash.
 * @param {string} password - Plain text password
 * @param {string} hash - bcrypt hash from database
 * @returns {Promise<boolean>} True if match
 */
exports.compare = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
