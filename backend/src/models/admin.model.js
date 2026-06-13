/**
 * Admin model - Database queries for admins table.
 * All queries use parameterized placeholders to prevent SQL injection.
 */
const pool = require('../config/db');

module.exports = {
  /** Find admin by username */
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash, real_name, phone, role, status, created_at, updated_at FROM admins WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  /** Find admin by ID */
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, real_name, phone, role, status, created_at, updated_at FROM admins WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Update password hash */
  async updatePassword(id, passwordHash) {
    await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [
      passwordHash,
      id,
    ]);
  },

  /** Create a new admin */
  async create({ username, passwordHash, realName, phone, role }) {
    const [result] = await pool.query(
      'INSERT INTO admins (username, password_hash, real_name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, realName, phone, role]
    );
    return result.insertId;
  },

  /** List operators (for work order assignment dropdown) */
  async findOperators() {
    const [rows] = await pool.query(
      'SELECT id, username, real_name, phone FROM admins WHERE role = ? AND status = 1',
      ['operator']
    );
    return rows;
  },
};
