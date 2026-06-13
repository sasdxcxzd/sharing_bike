/**
 * Operating Zone controller - Handles zone management HTTP requests.
 */
const zoneService = require('../services/zone.service');
const response = require('../utils/response');

module.exports = {
  /** GET /api/v1/zones */
  async list(req, res, next) {
    try {
      const zones = await zoneService.list();
      return response.success(res, zones);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/zones/:id */
  async getById(req, res, next) {
    try {
      const zone = await zoneService.getById(parseInt(req.params.id));
      return response.success(res, zone);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/zones */
  async create(req, res, next) {
    try {
      const { name, city, district, polygon, maxBikes } = req.body;

      if (!name || !city || !polygon || polygon.length < 3) {
        return response.error(res, '区域名称、城市和多边形坐标(至少3个点)不能为空', 400);
      }

      const zone = await zoneService.create({ name, city, district, polygon, maxBikes });
      return response.success(res, zone, '运营区域创建成功', 201);
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/v1/zones/:id */
  async update(req, res, next) {
    try {
      const zone = await zoneService.update(parseInt(req.params.id), req.body);
      return response.success(res, zone, '运营区域更新成功');
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/v1/zones/:id */
  async delete(req, res, next) {
    try {
      await zoneService.deleteZone(parseInt(req.params.id));
      return response.success(res, null, '运营区域已删除');
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/zones/:id/bikes */
  async getBikesInZone(req, res, next) {
    try {
      const bikes = await zoneService.getBikesInZone(parseInt(req.params.id));
      return response.success(res, bikes);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/zones/check-point */
  async checkPoint(req, res, next) {
    try {
      const { lat, lng } = req.body;

      if (lat === undefined || lng === undefined) {
        return response.error(res, '经纬度不能为空', 400);
      }

      const result = await zoneService.checkPoint(lat, lng);
      return response.success(res, result);
    } catch (err) {
      next(err);
    }
  },
};
