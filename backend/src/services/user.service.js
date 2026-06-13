/**
 * User service - Business logic for user management.
 */
const userModel = require('../models/user.model');

module.exports = {
  /** List users with pagination and phone search */
  async list(query) {
    return userModel.findAll(query);
  },

  /** Get user detail with ride statistics */
  async getById(id) {
    const user = await userModel.findById(id);
    if (!user) {
      throw Object.assign(new Error('用户不存在'), { statusCode: 404 });
    }
    return user;
  },

  /** Update user account status (freeze/unfreeze) */
  async updateStatus(id, status, adminRole) {
    if (adminRole !== 'super_admin') {
      throw Object.assign(new Error('仅超级管理员可修改用户状态'), { statusCode: 403 });
    }

    const user = await userModel.findById(id);
    if (!user) {
      throw Object.assign(new Error('用户不存在'), { statusCode: 404 });
    }

    await userModel.updateStatus(id, status);
    return userModel.findById(id);
  },
};
