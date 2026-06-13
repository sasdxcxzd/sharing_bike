/**
 * Bike controller - Handles bike-related HTTP requests.
 */
const bikeService = require('../services/bike.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/bikes */
  async list(req, res, next) {
    try {
      const { page, pageSize, status, keyword, zoneId } = req.query;
      const result = await bikeService.list({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        status,
        keyword,
        zoneId: zoneId ? parseInt(zoneId) : undefined,
      });
      return response.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/bikes/map/locations */
  async mapLocations(req, res, next) {
    try {
      const locations = await bikeService.getMapLocations();
      return response.success(res, locations);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/bikes/:id */
  async getById(req, res, next) {
    try {
      const bike = await bikeService.getById(parseInt(req.params.id));
      return response.success(res, bike);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/bikes */
  async create(req, res, next) {
    try {
      const { bikeNo, latitude, longitude, status, zoneId } = req.body;

      if (!bikeNo || latitude === undefined || longitude === undefined) {
        return response.error(res, '车辆编号、经纬度不能为空', 400);
      }

      const bike = await bikeService.create({
        bikeNo,
        latitude,
        longitude,
        status,
        zoneId,
      });
      return response.success(res, bike, '单车创建成功', 201);
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/v1/bikes/:id */
  async update(req, res, next) {
    try {
      const bike = await bikeService.update(parseInt(req.params.id), req.body, req.admin.id);
      return response.success(res, bike, '单车信息更新成功');
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/v1/bikes/:id/status */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;

      if (!status) {
        return response.error(res, '状态不能为空', 400);
      }

      const bike = await bikeService.updateStatus(
        parseInt(req.params.id),
        status,
        req.admin.id
      );
      return response.success(res, bike, '单车状态更新成功');
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/v1/bikes/:id */
  async delete(req, res, next) {
    try {
      await bikeService.deleteBike(parseInt(req.params.id));
      return response.success(res, null, '单车已删除');
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/bikes/:id/track */
  async getTrack(req, res, next) {
    try {
      const track = await bikeService.getBikeTrack(parseInt(req.params.id));
      return response.success(res, track);
    } catch (err) {
      next(err);
    }
  },
};
