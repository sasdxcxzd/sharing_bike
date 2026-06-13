/**
 * Notification controller - Handles notification HTTP requests.
 */
const notificationService = require('../services/notification.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/notifications */
  async list(req, res, next) {
    try {
      const { page, pageSize, userId } = req.query;
      const result = await notificationService.list({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        targetUserId: userId ? parseInt(userId) : undefined,
      });
      return response.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/notifications */
  async send(req, res, next) {
    try {
      const { targetUserId, title, content, type } = req.body;

      if (!targetUserId || !title || !content) {
        return response.error(res, '目标用户ID、标题和内容不能为空', 400);
      }

      const notification = await notificationService.send(
        { targetUserId, title, content, type },
        req.admin.id
      );
      return response.success(res, notification, '通知发送成功', 201);
    } catch (err) {
      next(err);
    }
  },
};
