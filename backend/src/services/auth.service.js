/**
 * Auth service - Authentication business logic.
 */
const crypto = require('crypto');
const adminModel = require('../models/admin.model');
const jwtUtil = require('../utils/jwt');
const bcryptUtil = require('../utils/bcrypt');
const redis = require('../config/redis');

/** Generate a SHA-256 hash of a token for blacklist lookup */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  /**
   * Admin login - verify credentials and return JWT token.
   * @param {string} username
   * @param {string} password
   * @returns {{ token, admin }} JWT token and admin info
   * @throws Error if credentials invalid or account disabled
   */
  async login(username, password) {
    const admin = await adminModel.findByUsername(username);
    if (!admin) {
      throw Object.assign(new Error('用户名或密码错误'), { statusCode: 401 });
    }

    if (admin.status !== 1) {
      throw Object.assign(new Error('账号已被禁用，请联系管理员'), { statusCode: 403 });
    }

    const valid = await bcryptUtil.compare(password, admin.password_hash);
    if (!valid) {
      throw Object.assign(new Error('用户名或密码错误'), { statusCode: 401 });
    }

    // Sign JWT with admin info
    const token = jwtUtil.sign({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        real_name: admin.real_name,
        phone: admin.phone,
        role: admin.role,
      },
    };
  },

  /**
   * Logout - add token to Redis blacklist.
   * @param {string} token - The JWT token to invalidate
   */
  async logout(token) {
    // Decode to get expiration, blacklist until then
    let ttl = 86400; // default 24h
    try {
      const decoded = jwtUtil.verify(token);
      ttl = Math.max(1, Math.floor((decoded.exp * 1000 - Date.now()) / 1000));
    } catch (e) {
      // Token already expired or invalid - still blacklist for 1 hour
      ttl = 3600;
    }

    const tokenHash = hashToken(token);
    await redis.set(`blacklist:${tokenHash}`, '1', 'EX', ttl);
  },

  /** Get current admin profile */
  async getProfile(adminId) {
    const admin = await adminModel.findById(adminId);
    if (!admin) {
      throw Object.assign(new Error('管理员不存在'), { statusCode: 404 });
    }
    return admin;
  },

  /** Change admin password */
  async changePassword(adminId, oldPassword, newPassword) {
    const admin = await adminModel.findById(adminId);
    // Need full record with password_hash
    const fullAdmin = await adminModel.findByUsername(admin.username);

    const valid = await bcryptUtil.compare(oldPassword, fullAdmin.password_hash);
    if (!valid) {
      throw Object.assign(new Error('原密码错误'), { statusCode: 400 });
    }

    const newHash = await bcryptUtil.hash(newPassword);
    await adminModel.updatePassword(adminId, newHash);
  },
};
