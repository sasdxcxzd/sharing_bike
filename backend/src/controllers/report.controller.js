/**
 * User Report controller - Handles report management HTTP requests.
 */
const reportService = require('../services/report.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/reports */
  async list(req, res, next) {
    try {
      const { page, pageSize, reportType, status } = req.query;
      const result = await reportService.list({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        reportType,
        status,
      });
      return response.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/reports/:id */
  async getById(req, res, next) {
    try {
      const report = await reportService.getById(parseInt(req.params.id));
      return response.success(res, report);
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/v1/reports/:id/review */
  async review(req, res, next) {
    try {
      const { status, reviewComment } = req.body;

      if (!status || !['resolved', 'rejected'].includes(status)) {
        return response.error(res, '审核状态必须为 resolved 或 rejected', 400);
      }

      const report = await reportService.review(
        parseInt(req.params.id),
        { status, reviewComment },
        req.admin.id
      );
      return response.success(res, report, '审核完成');
    } catch (err) {
      next(err);
    }
  },
};
