/**
 * User model - Database queries for users table (end-users / riders).
 */
const pool = require('../config/db');

module.exports = {
  /** List users with pagination and phone search */
  async findAll({ page = 1, pageSize = 20, keyword }) {
    let sql = 'SELECT id, phone, real_name, deposit, balance, status, registered_at FROM users WHERE 1=1';
    const params = [];

    if (keyword) {
      sql += ' AND (phone LIKE ? OR real_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [countResult] = await pool.query(
      sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * pageSize;
    sql += ' ORDER BY registered_at DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(sql, [...params, pageSize, offset]);

    return { list: rows, total, page, pageSize };
  },

  /** Find user by ID with ride statistics */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.*,
        (SELECT COUNT(*) FROM ride_orders WHERE user_id = u.id) as total_rides,
        (SELECT SUM(fee) FROM ride_orders WHERE user_id = u.id AND payment_status = 1) as total_spent
       FROM users u WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Update user account status (1=normal, 0=frozen) */
  async updateStatus(id, status) {
    const [result] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows;
  },
};
