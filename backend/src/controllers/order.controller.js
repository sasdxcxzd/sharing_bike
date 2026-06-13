/**
 * Ride Order controller - Handles order-related HTTP requests.
 */
const orderService = require('../services/order.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/orders */
  async list(req, res, next) {
    try {
      const { page, pageSize, status, userId, bikeId, startDate, endDate, keyword } = req.query;
      const result = await orderService.list({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        status,
        userId: userId ? parseInt(userId) : undefined,
        bikeId: bikeId ? parseInt(bikeId) : undefined,
        startDate,
        endDate,
        keyword,
      });
      return response.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/orders/:id */
  async getById(req, res, next) {
    try {
      const order = await orderService.getById(parseInt(req.params.id));
      return response.success(res, order);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/orders/stats/summary */
  async statsSummary(req, res, next) {
    try {
      const stats = await orderService.getStatsSummary();
      return response.success(res, stats);
    } catch (err) {
      next(err);
    }
  },
};
