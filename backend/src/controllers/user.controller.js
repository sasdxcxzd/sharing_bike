/**
 * User controller - Handles user management HTTP requests.
 */
const userService = require('../services/user.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/users */
  async list(req, res, next) {
    try {
      const { page, pageSize, keyword } = req.query;
      const result = await userService.list({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        keyword,
      });
      return response.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/users/:id */
  async getById(req, res, next) {
    try {
      const user = await userService.getById(parseInt(req.params.id));
      return response.success(res, user);
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/v1/users/:id/status */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;

      if (status === undefined) {
        return response.error(res, '状态不能为空', 400);
      }

      const user = await userService.updateStatus(
        parseInt(req.params.id),
        status,
        req.admin.role
      );
      return response.success(res, user, '用户状态更新成功');
    } catch (err) {
      next(err);
    }
  },
};
