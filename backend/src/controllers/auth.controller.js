/**
 * Auth controller - Handles authentication HTTP requests.
 */
const authService = require('../services/auth.service');
const adminModel = require('../models/admin.model');
const bcryptUtil = require('../utils/bcrypt');
const response = require('../utils/response');

module.exports = {
  /** POST /api/v1/auth/login */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return response.error(res, '用户名和密码不能为空', 400);
      }

      const result = await authService.login(username, password);
      return response.success(res, result, '登录成功');
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/auth/logout */
  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        await authService.logout(token);
      }
      return response.success(res, null, '已退出登录');
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/auth/profile */
  async getProfile(req, res, next) {
    try {
      const admin = await authService.getProfile(req.admin.id);
      return response.success(res, admin);
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/v1/auth/password */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return response.error(res, '原密码和新密码不能为空', 400);
      }

      if (newPassword.length < 6) {
        return response.error(res, '新密码长度不能少于6位', 400);
      }

      await authService.changePassword(req.admin.id, oldPassword, newPassword);
      return response.success(res, null, '密码修改成功');
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/auth/register - Register a new operator account */
  async register(req, res, next) {
    try {
      const { username, password, realName, phone } = req.body;

      if (!username || !password || !realName) {
        return response.error(res, '用户名、密码、真实姓名不能为空', 400);
      }

      if (username.length < 3) {
        return response.error(res, '用户名至少3个字符', 400);
      }

      if (password.length < 6) {
        return response.error(res, '密码至少6位', 400);
      }

      // Check if username already exists
      const existing = await adminModel.findByUsername(username);
      if (existing) {
        return response.error(res, '用户名已存在', 409);
      }

      const passwordHash = await bcryptUtil.hash(password);
      const adminId = await adminModel.create({
        username,
        passwordHash,
        realName,
        phone: phone || null,
        role: 'operator', // New registrations default to operator role
      });

      return response.success(res, { id: adminId, username }, '注册成功', 201);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/auth/operators - List operators for work order assignment */
  async getOperators(req, res, next) {
    try {
      const operators = await adminModel.findOperators();
      return response.success(res, operators);
    } catch (err) {
      next(err);
    }
  },
};
