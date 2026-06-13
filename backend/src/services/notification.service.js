/**
 * Notification service - Business logic for sending system notifications.
 */
const notificationModel = require('../models/notification.model');
const userModel = require('../models/user.model');

module.exports = {
  /** List notifications with optional user filter */
  async list(query) {
    return notificationModel.findAll(query);
  },

  /**
   * Send a notification to a specific user.
   * Verifies the target user exists before sending.
   */
  async send({ targetUserId, title, content, type }, adminId) {
    const user = await userModel.findById(targetUserId);
    if (!user) {
      throw Object.assign(new Error('目标用户不存在'), { statusCode: 404 });
    }

    const id = await notificationModel.create({
      senderId: adminId,
      targetUserId,
      title,
      content,
      type,
    });

    return { id, targetUserId, title, type };
  },
};
