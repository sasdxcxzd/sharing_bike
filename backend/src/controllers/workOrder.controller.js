/**
 * Work Order controller - Handles work order HTTP requests.
 */
const workOrderService = require('../services/workOrder.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/work-orders */
  async list(req, res, next) {
    try {
      const { page, pageSize, status, severity, assigneeId } = req.query;
      const result = await workOrderService.list({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        status,
        severity,
        assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
      });
      return response.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/work-orders/:id */
  async getById(req, res, next) {
    try {
      const wo = await workOrderService.getById(parseInt(req.params.id));
      return response.success(res, wo);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/work-orders */
  async create(req, res, next) {
    try {
      const bikeId = req.body.bikeId ? parseInt(req.body.bikeId) : null;
      const { faultType, description, severity } = req.body;

      if (!faultType) {
        return response.error(res, '故障类型不能为空', 400);
      }

      const wo = await workOrderService.create(
        { bikeId, faultType, description, severity },
        req.admin.id
      );
      return response.success(res, wo, '工单创建成功', 201);
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/v1/work-orders/:id */
  async update(req, res, next) {
    try {
      const wo = await workOrderService.update(parseInt(req.params.id), req.body);
      return response.success(res, wo, '工单更新成功');
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/v1/work-orders/:id/assign */
  async assign(req, res, next) {
    try {
      const { assigneeId } = req.body;

      if (!assigneeId) {
        return response.error(res, '指派人ID不能为空', 400);
      }

      const wo = await workOrderService.assign(
        parseInt(req.params.id),
        parseInt(assigneeId)
      );
      return response.success(res, wo, '工单指派成功');
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/v1/work-orders/:id/status */
  async updateStatus(req, res, next) {
    try {
      const { status, notes } = req.body;

      if (!status) {
        return response.error(res, '状态不能为空', 400);
      }

      const wo = await workOrderService.updateStatus(
        parseInt(req.params.id),
        status,
        notes || null,
        null, // completedAt
        req.admin // pass admin for auto-assign
      );
      return response.success(res, wo, '工单状态更新成功');
    } catch (err) {
      next(err);
    }
  },
};
