/**
 * Bike service - Business logic for bike management.
 */
const bikeModel = require('../models/bike.model');
const workOrderModel = require('../models/workOrder.model');
const redis = require('../config/redis');

module.exports = {
  /** List bikes with pagination and filters */
  async list(query) {
    return bikeModel.findAll(query);
  },

  /** Get bike detail */
  async getById(id) {
    const bike = await bikeModel.findById(id);
    if (!bike) {
      throw Object.assign(new Error('单车不存在'), { statusCode: 404 });
    }
    return bike;
  },

  /**
   * Create a new bike.
   * Checks for duplicate bike_no before creating.
   */
  async create({ bikeNo, latitude, longitude, status, zoneId }) {
    const existing = await bikeModel.findByBikeNo(bikeNo);
    if (existing) {
      throw Object.assign(new Error(`单车编号 ${bikeNo} 已存在`), { statusCode: 409 });
    }

    const id = await bikeModel.create({
      bikeNo,
      latitude,
      longitude,
      status: status || 'deployed',
      zoneId,
      deployedAt: new Date(),
    });

    return bikeModel.findById(id);
  },

  /** Update bike information */
  async update(id, fields, adminId) {
    const bike = await bikeModel.findById(id);
    if (!bike) {
      throw Object.assign(new Error('单车不存在'), { statusCode: 404 });
    }

    // If status changes to 'repairing', auto-create work order
    if (fields.status === 'repairing' && bike.status !== 'repairing') {
      await workOrderModel.create({
        bikeId: id,
        reporterId: adminId,
        faultType: 'manual_report',
        description: `管理员手动将车辆状态改为维修中`,
        severity: 'minor',
      });
    }

    await bikeModel.update(id, fields);
    return bikeModel.findById(id);
  },

  /** Update bike status. Creates work order if status changes to 'repairing'. */
  async updateStatus(id, status, adminId) {
    const bike = await bikeModel.findById(id);
    if (!bike) {
      throw Object.assign(new Error('单车不存在'), { statusCode: 404 });
    }

    await bikeModel.updateStatus(id, status);

    // Auto-create work order when bike is reported for repair
    if (status === 'repairing') {
      await workOrderModel.create({
        bikeId: id,
        reporterId: adminId,
        faultType: 'status_change',
        description: `车辆状态由系统/管理员变更为维修中`,
        severity: 'minor',
      });
    }

    return bikeModel.findById(id);
  },

  /** Delete bike (super_admin only) */
  async deleteBike(id) {
    const bike = await bikeModel.findById(id);
    if (!bike) {
      throw Object.assign(new Error('单车不存在'), { statusCode: 404 });
    }
    await bikeModel.deleteById(id);
  },

  /**
   * Get all bike locations for the map.
   * Results are cached in Redis with a 5-second TTL.
   */
  async getMapLocations() {
    // Try Redis cache first
    const cached = await redis.get('bike:locations');
    if (cached) {
      return JSON.parse(cached);
    }

    const locations = await bikeModel.findAllLocations();

    // Cache for 5 seconds
    await redis.set('bike:locations', JSON.stringify(locations), 'EX', 5);

    return locations;
  },

  /** Get bike location tracking history */
  async getBikeTrack(bikeId, limit = 50) {
    const bike = await bikeModel.findById(bikeId);
    if (!bike) {
      throw Object.assign(new Error('单车不存在'), { statusCode: 404 });
    }

    const [rows] = await require('../config/db').query(
      'SELECT latitude, longitude, recorded_at FROM bike_location_log WHERE bike_id = ? ORDER BY recorded_at DESC LIMIT ?',
      [bikeId, limit]
    );
    return rows;
  },
};
