/**
 * Dashboard controller - Handles dashboard statistics HTTP requests.
 */
const dashboardService = require('../services/dashboard.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/dashboard/overview */
  async overview(req, res, next) {
    try {
      const data = await dashboardService.getOverview();
      return response.success(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/dashboard/ride-trend */
  async rideTrend(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;
      const data = await dashboardService.getRideTrend(days);
      return response.success(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/dashboard/revenue-trend */
  async revenueTrend(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;
      const data = await dashboardService.getRevenueTrend(days);
      return response.success(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/dashboard/status-distribution */
  async statusDistribution(req, res, next) {
    try {
      const data = await dashboardService.getStatusDistribution();
      return response.success(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/dashboard/fault-trend */
  async faultTrend(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 30;
      const data = await dashboardService.getFaultTrend(days);
      return response.success(res, data);
    } catch (err) {
      next(err);
    }
  },
};
