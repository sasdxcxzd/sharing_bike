/**
 * User Report service - Business logic for report management.
 */
const reportModel = require('../models/userReport.model');

module.exports = {
  /** List reports with filters */
  async list(query) {
    return reportModel.findAll(query);
  },

  /** Get report detail */
  async getById(id) {
    const report = await reportModel.findById(id);
    if (!report) {
      throw Object.assign(new Error('举报不存在'), { statusCode: 404 });
    }
    return report;
  },

  /** Admin review a report (approve/reject) */
  async review(id, { status, reviewComment }, adminId) {
    const report = await reportModel.findById(id);
    if (!report) {
      throw Object.assign(new Error('举报不存在'), { statusCode: 404 });
    }

    await reportModel.review(id, {
      status,
      reviewerId: adminId,
      reviewComment,
    });

    return reportModel.findById(id);
  },
};
