/**
 * Ride Order model - Database queries for ride_orders table.
 */
const pool = require('../config/db');

module.exports = {
  /** List orders with pagination and filters */
  async findAll({ page = 1, pageSize = 20, status, userId, bikeId, startDate, endDate, keyword }) {
    let sql = `
      SELECT ro.*, u.phone as user_phone, b.bike_no
      FROM ride_orders ro
      LEFT JOIN users u ON ro.user_id = u.id
      LEFT JOIN bikes b ON ro.bike_id = b.id
      WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND ro.status = ?';
      params.push(status);
    }
    if (userId) {
      sql += ' AND ro.user_id = ?';
      params.push(userId);
    }
    if (bikeId) {
      sql += ' AND ro.bike_id = ?';
      params.push(bikeId);
    }
    if (startDate) {
      sql += ' AND ro.start_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND ro.start_time <= ?';
      params.push(endDate + ' 23:59:59');
    }
    if (keyword) {
      sql += ' AND ro.order_no LIKE ?';
      params.push(`%${keyword}%`);
    }

    // Count
    const [countResult] = await pool.query(
      sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * pageSize;
    sql += ' ORDER BY ro.start_time DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(sql, [...params, pageSize, offset]);

    return { list: rows, total, page, pageSize };
  },

  /** Find order by ID with joins */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ro.*,
        u.phone as user_phone, u.real_name as user_name,
        b.bike_no, b.latitude, b.longitude
       FROM ride_orders ro
       LEFT JOIN users u ON ro.user_id = u.id
       LEFT JOIN bikes b ON ro.bike_id = b.id
       WHERE ro.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Get today's ride statistics */
  async getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) as total_rides,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rides,
        COALESCE(SUM(CASE WHEN payment_status = 1 THEN fee ELSE 0 END), 0) as total_revenue
       FROM ride_orders
       WHERE DATE(start_time) = ?`,
      [today]
    );
    return rows[0];
  },

  /** Get ride trend data for charts (last N days) */
  async getRideTrend(days = 7) {
    const [rows] = await pool.query(
      `SELECT DATE(start_time) as date, COUNT(*) as count
       FROM ride_orders
       WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(start_time)
       ORDER BY date ASC`,
      [days]
    );
    return rows;
  },

  /** Get revenue trend data */
  async getRevenueTrend(days = 7) {
    const [rows] = await pool.query(
      `SELECT DATE(start_time) as date, COALESCE(SUM(fee), 0) as revenue
       FROM ride_orders
       WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND payment_status = 1
       GROUP BY DATE(start_time)
       ORDER BY date ASC`,
      [days]
    );
    return rows;
  },
};
