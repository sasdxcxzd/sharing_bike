/**
 * Bike model - Database queries for bikes table.
 */
const pool = require('../config/db');

module.exports = {
  /** List bikes with pagination, search, and filters */
  async findAll({ page = 1, pageSize = 20, status, keyword, zoneId }) {
    let sql = 'SELECT * FROM bikes WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (keyword) {
      sql += ' AND bike_no LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (zoneId) {
      sql += ' AND zone_id = ?';
      params.push(zoneId);
    }

    // Count total
    const [countResult] = await pool.query(
      sql.replace('SELECT *', 'SELECT COUNT(*) as total'),
      params
    );
    const total = countResult[0].total;

    // Paginated data
    const offset = (page - 1) * pageSize;
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(sql, [...params, pageSize, offset]);

    return { list: rows, total, page, pageSize };
  },

  /** Find bike by ID */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT b.*, oz.name as zone_name
       FROM bikes b
       LEFT JOIN operating_zones oz ON b.zone_id = oz.id
       WHERE b.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find bike by bike_no */
  async findByBikeNo(bikeNo) {
    const [rows] = await pool.query('SELECT * FROM bikes WHERE bike_no = ?', [bikeNo]);
    return rows[0] || null;
  },

  /** Create a new bike */
  async create({ bikeNo, latitude, longitude, status, zoneId, deployedAt }) {
    const [result] = await pool.query(
      `INSERT INTO bikes (bike_no, latitude, longitude, status, zone_id, deployed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bikeNo, latitude, longitude, status, zoneId || null, deployedAt || null]
    );
    return result.insertId;
  },

  /** Update bike fields */
  async update(id, fields) {
    const allowed = ['bike_no', 'latitude', 'longitude', 'lock_status', 'battery_level', 'zone_id'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (sets.length === 0) return 0;

    params.push(id);
    const [result] = await pool.query(`UPDATE bikes SET ${sets.join(', ')} WHERE id = ?`, params);
    return result.affectedRows;
  },

  /** Update bike status */
  async updateStatus(id, status) {
    const [result] = await pool.query('UPDATE bikes SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows;
  },

  /** Delete bike by ID */
  async deleteById(id) {
    const [result] = await pool.query('DELETE FROM bikes WHERE id = ?', [id]);
    return result.affectedRows;
  },

  /** Get all bike locations for map (cached in Redis by service layer) */
  async findAllLocations() {
    const [rows] = await pool.query(
      'SELECT id, bike_no, latitude, longitude, status, battery_level FROM bikes WHERE status != ?',
      ['scrapped']
    );
    return rows;
  },

  /** Update bike location */
  async updateLocation(id, latitude, longitude) {
    await pool.query('UPDATE bikes SET latitude = ?, longitude = ? WHERE id = ?', [
      latitude,
      longitude,
      id,
    ]);
  },

  /** Count bikes by status */
  async countByStatus() {
    const [rows] = await pool.query(
      'SELECT status, COUNT(*) as count FROM bikes GROUP BY status'
    );
    return rows;
  },

  /** Find bikes inside a zone (bounding box pre-filter + Haversine in JS) */
  async findByZoneId(zoneId) {
    const [rows] = await pool.query(
      'SELECT id, bike_no, latitude, longitude, status FROM bikes WHERE zone_id = ?',
      [zoneId]
    );
    return rows;
  },
};
