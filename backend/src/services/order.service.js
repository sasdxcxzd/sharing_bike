/**
 * Ride Order service - Business logic for ride order management.
 */
const rideOrderModel = require('../models/rideOrder.model');

module.exports = {
  /** List orders with pagination and filters */
  async list(query) {
    return rideOrderModel.findAll(query);
  },

  /** Get order detail */
  async getById(id) {
    const order = await rideOrderModel.findById(id);
    if (!order) {
      throw Object.assign(new Error('订单不存在'), { statusCode: 404 });
    }
    return order;
  },

  /** Get order stats summary */
  async getStatsSummary() {
    return rideOrderModel.getTodayStats();
  },
};
