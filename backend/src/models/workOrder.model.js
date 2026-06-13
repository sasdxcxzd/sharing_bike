/**
 * Work Order model - Database queries for work_orders table.
 */
const pool = require('../config/db');
const crypto = require('crypto');

/** Generate a unique work order number */
function generateOrderNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `WO${date}${rand}`;
}

module.exports = {
  /** List work orders with pagination and filters */
  async findAll({ page = 1, pageSize = 20, status, severity, assigneeId }) {
    let sql = `
      SELECT wo.*, b.bike_no,
        reporter.real_name as reporter_name,
        assignee.real_name as assignee_name
      FROM work_orders wo
      LEFT JOIN bikes b ON wo.bike_id = b.id
      LEFT JOIN admins reporter ON wo.reporter_id = reporter.id
      LEFT JOIN admins assignee ON wo.assignee_id = assignee.id
      WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND wo.status = ?';
      params.push(status);
    }
    if (severity) {
      sql += ' AND wo.severity = ?';
      params.push(severity);
    }
    if (assigneeId) {
      sql += ' AND wo.assignee_id = ?';
      params.push(assigneeId);
    }

    const [countResult] = await pool.query(
      sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * pageSize;
    sql += ' ORDER BY wo.created_at DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.query(sql, [...params, pageSize, offset]);

    return { list: rows, total, page, pageSize };
  },

  /** Find work order by ID with joins */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT wo.*, b.bike_no, b.latitude, b.longitude,
        reporter.real_name as reporter_name,
        assignee.real_name as assignee_name
       FROM work_orders wo
       LEFT JOIN bikes b ON wo.bike_id = b.id
       LEFT JOIN admins reporter ON wo.reporter_id = reporter.id
       LEFT JOIN admins assignee ON wo.assignee_id = assignee.id
       WHERE wo.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new work order */
  async create({ bikeId, reporterId, faultType, description, severity }) {
    const orderNo = generateOrderNo();
    const [result] = await pool.query(
      `INSERT INTO work_orders (order_no, bike_id, reporter_id, fault_type, description, severity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderNo, bikeId || null, reporterId || null, faultType, description || null, severity || 'minor']
    );
    return { id: result.insertId, orderNo };
  },

  /** Update work order */
  async update(id, fields) {
    const allowed = ['fault_type', 'description', 'severity', 'notes', 'images'];
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
    const [result] = await pool.query(`UPDATE work_orders SET ${sets.join(', ')} WHERE id = ?`, params);
    return result.affectedRows;
  },

  /** Assign repair person */
  async assign(id, assigneeId) {
    const [result] = await pool.query(
      "UPDATE work_orders SET assignee_id = ?, status = 'assigned' WHERE id = ?",
      [assigneeId, id]
    );
    return result.affectedRows;
  },

  /** Update work order status */
  async updateStatus(id, status, notes = null, completedAt = null) {
    const sets = ['status = ?'];
    const params = [status];

    if (notes) {
      sets.push('notes = ?');
      params.push(notes);
    }
    if (status === 'completed') {
      sets.push('completed_at = ?');
      params.push(completedAt || new Date());
    }

    params.push(id);
    const [result] = await pool.query(
      `UPDATE work_orders SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows;
  },

  /** Get fault statistics for dashboard */
  async countByStatus() {
    const [rows] = await pool.query(
      'SELECT status, COUNT(*) as count FROM work_orders GROUP BY status'
    );
    return rows;
  },

  /** Get recent fault rate (fault_type distribution) */
  async getFaultDistribution() {
    const [rows] = await pool.query(
      'SELECT fault_type, COUNT(*) as count FROM work_orders GROUP BY fault_type ORDER BY count DESC'
    );
    return rows;
  },
};
