/**
 * Notification model - Database queries for notifications table.
 */
const pool = require('../config/db');

module.exports = {
  /** List notifications with optional user filter */
  async findAll({ page = 1, pageSize = 20, targetUserId }) {
    let sql = `
      SELECT n.*, sender.real_name as sender_name, u.phone as target_phone, u.real_name as target_name
      FROM notifications n
      LEFT JOIN admins sender ON n.sender_id = sender.id
      LEFT JOIN users u ON n.target_user_id = u.id
      WHERE 1=1`;
    const params = [];

    if (targetUserId) {
      sql += ' AND n.target_user_id = ?';
      params.push(targetUserId);
    }

    const [countResult] = await pool.query(
      sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * pageSize;
    sql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(sql, [...params, pageSize, offset]);

    return { list: rows, total, page, pageSize };
  },

  /** Create a notification */
  async create({ senderId, targetUserId, title, content, type }) {
    const [result] = await pool.query(
      'INSERT INTO notifications (sender_id, target_user_id, title, content, type) VALUES (?, ?, ?, ?, ?)',
      [senderId, targetUserId, title, content, type || 'system']
    );
    return result.insertId;
  },
};
