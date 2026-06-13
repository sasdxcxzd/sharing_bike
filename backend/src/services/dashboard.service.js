/**
 * Dashboard service - Business logic for the statistics dashboard.
 * Aggregates data from multiple models and caches results in Redis.
 */
const bikeModel = require('../models/bike.model');
const rideOrderModel = require('../models/rideOrder.model');
const workOrderModel = require('../models/workOrder.model');
const redis = require('../config/redis');

module.exports = {
  /**
   * Get dashboard overview statistics.
   * Cached in Redis for 60 seconds.
   */
  async getOverview() {
    const cached = await redis.get('dashboard:overview');
    if (cached) {
      return JSON.parse(cached);
    }

    // Today's ride stats
    const todayStats = await rideOrderModel.getTodayStats();

    // Bike status counts
    const bikeStatuses = await bikeModel.countByStatus();
    const statusMap = {};
    bikeStatuses.forEach(s => { statusMap[s.status] = s.count; });

    const totalBikes = bikeStatuses.reduce((sum, s) => sum + s.count, 0);
    const activeBikes = (statusMap['in_use'] || 0) + (statusMap['available'] || 0);
    const faultBikes = statusMap['repairing'] || 0;
    const faultRate = totalBikes > 0 ? (faultBikes / totalBikes * 100).toFixed(1) : 0;

    // Additional stats
    const pool = require('../config/db');
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ pendingWorkOrders }]] = await pool.query("SELECT COUNT(*) as pendingWorkOrders FROM work_orders WHERE status IN ('pending', 'assigned')");
    const [[{ onlineBikes }]] = await pool.query("SELECT COUNT(*) as onlineBikes FROM bikes WHERE status IN ('available', 'in_use')");

    const overview = {
      todayRides: todayStats.total_rides || 0,
      activeBikes,
      totalBikes,
      todayRevenue: Number(todayStats.total_revenue || 0).toFixed(2),
      faultRate: Number(faultRate),
      completedRides: todayStats.completed_rides || 0,
      activeRidesNow: todayStats.active_rides || 0,
      totalUsers,
      pendingWorkOrders,
      onlineBikes,
    };

    // Cache for 5 seconds (near real-time, still protects DB from thundering herd)
    await redis.set('dashboard:overview', JSON.stringify(overview), 'EX', 5);

    return overview;
  },

  /** Get ride trend data for charts */
  async getRideTrend(days = 7) {
    const data = await rideOrderModel.getRideTrend(days);

    // Fill in missing dates with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = data.find(r => {
        const rd = new Date(r.date);
        return rd.toISOString().split('T')[0] === dateStr;
      });
      result.push({
        date: dateStr,
        count: found ? found.count : 0,
      });
    }

    return result;
  },

  /** Get revenue trend data */
  async getRevenueTrend(days = 7) {
    const data = await rideOrderModel.getRevenueTrend(days);

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = data.find(r => {
        const rd = new Date(r.date);
        return rd.toISOString().split('T')[0] === dateStr;
      });
      result.push({
        date: dateStr,
        revenue: found ? Number(found.revenue) : 0,
      });
    }

    return result;
  },

  /** Get bike status distribution for pie chart */
  async getStatusDistribution() {
    const statuses = await bikeModel.countByStatus();
    return statuses.map(s => ({
      name: statusLabel(s.status),
      value: s.count,
    }));
  },

  /** Get fault trend data */
  async getFaultTrend(days = 30) {
    const [rows] = await require('../config/db').query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM work_orders
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = rows.find(r => {
        const rd = new Date(r.date);
        return rd.toISOString().split('T')[0] === dateStr;
      });
      result.push({
        date: dateStr,
        count: found ? found.count : 0,
      });
    }

    return result;
  },
};

/** Map status enum to Chinese label */
function statusLabel(status) {
  const labels = {
    available: '可用',
    in_use: '骑行中',
    repairing: '维修中',
    scrapped: '已报废',
    deployed: '已投放',
  };
  return labels[status] || status;
}
