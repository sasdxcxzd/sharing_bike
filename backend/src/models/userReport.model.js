/**
 * User Report model - Database queries for user_reports table.
 */
const pool = require('../config/db');

module.exports = {
  /** List user reports with pagination and filters */
  async findAll({ page = 1, pageSize = 20, reportType, status }) {
    let sql = `
      SELECT ur.*, u.phone as user_phone, u.real_name as user_name,
        b.bike_no, reviewer.real_name as reviewer_name
      FROM user_reports ur
      LEFT JOIN users u ON ur.user_id = u.id
      LEFT JOIN bikes b ON ur.bike_id = b.id
      LEFT JOIN admins reviewer ON ur.reviewer_id = reviewer.id
      WHERE 1=1`;
    const params = [];

    if (reportType) {
      sql += ' AND ur.report_type = ?';
      params.push(reportType);
    }
    if (status) {
      sql += ' AND ur.status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(
      sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * pageSize;
    sql += ' ORDER BY ur.created_at DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(sql, [...params, pageSize, offset]);

    return { list: rows, total, page, pageSize };
  },

  /** Find report by ID with joins */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ur.*, u.phone as user_phone, u.real_name as user_name,
        b.bike_no, reviewer.real_name as reviewer_name
       FROM user_reports ur
       LEFT JOIN users u ON ur.user_id = u.id
       LEFT JOIN bikes b ON ur.bike_id = b.id
       LEFT JOIN admins reviewer ON ur.reviewer_id = reviewer.id
       WHERE ur.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Admin review a report */
  async review(id, { status, reviewerId, reviewComment }) {
    const [result] = await pool.query(
      'UPDATE user_reports SET status = ?, reviewer_id = ?, review_comment = ? WHERE id = ?',
      [status, reviewerId, reviewComment || null, id]
    );
    return result.affectedRows;
  },
};
