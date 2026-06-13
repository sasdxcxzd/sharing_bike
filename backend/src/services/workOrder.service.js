/**
 * Work Order service - Business logic for maintenance work orders.
 */
const workOrderModel = require('../models/workOrder.model');
const bikeModel = require('../models/bike.model');

module.exports = {
  /** List work orders with filters */
  async list(query) {
    return workOrderModel.findAll(query);
  },

  /** Get work order detail */
  async getById(id) {
    const wo = await workOrderModel.findById(id);
    if (!wo) {
      throw Object.assign(new Error('工单不存在'), { statusCode: 404 });
    }
    return wo;
  },

  /**
   * Manually create a work order.
   * If bikeId is provided, update bike status to 'repairing'.
   */
  async create({ bikeId, faultType, description, severity }, adminId) {
    if (bikeId) {
      const bike = await bikeModel.findById(bikeId);
      if (!bike) {
        throw Object.assign(new Error('单车不存在'), { statusCode: 404 });
      }
      // Update bike status to repairing
      await bikeModel.updateStatus(bikeId, 'repairing');
    }

    return workOrderModel.create({
      bikeId,
      reporterId: adminId,
      faultType,
      description,
      severity,
    });
  },

  /** Update work order information */
  async update(id, fields) {
    const wo = await workOrderModel.findById(id);
    if (!wo) {
      throw Object.assign(new Error('工单不存在'), { statusCode: 404 });
    }

    await workOrderModel.update(id, fields);
    return workOrderModel.findById(id);
  },

  /** Assign a repair person to the work order */
  async assign(id, assigneeId) {
    const wo = await workOrderModel.findById(id);
    if (!wo) {
      throw Object.assign(new Error('工单不存在'), { statusCode: 404 });
    }

    await workOrderModel.assign(id, assigneeId);
    return workOrderModel.findById(id);
  },

  /**
   * Update work order status.
   * When marked as 'completed', also update bike status back to 'available'.
   * When starting work (in_progress) and work order is unassigned, auto-assign to operator.
   */
  async updateStatus(id, status, notes, completedAt, operator) {
    const wo = await workOrderModel.findById(id);
    if (!wo) {
      throw Object.assign(new Error('工单不存在'), { statusCode: 404 });
    }

    // Auto-assign: when an operator starts work on an unassigned/pending work order
    if (status === 'in_progress' && !wo.assignee_id && operator) {
      await workOrderModel.assign(id, operator.id);
    }

    await workOrderModel.updateStatus(id, status, notes, completedAt);

    // If completed, restore bike to available
    if (status === 'completed' && wo.bike_id) {
      await bikeModel.updateStatus(wo.bike_id, 'available');
    }

    return workOrderModel.findById(id);
  },
};
