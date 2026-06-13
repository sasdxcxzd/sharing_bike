/**
 * Seed Admin Script.
 * Creates a default super admin account if one doesn't exist.
 *
 * Usage: node src/scripts/seedAdmin.js
 *
 * Default credentials:
 *   Username: admin
 *   Password: admin123
 *
 * IMPORTANT: Change the password immediately after first login!
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'bike_admin_2024',
  database: process.env.DB_NAME || 'shared_bike',
};

async function seedAdmin() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('[SeedAdmin] Connected to MySQL');

    // Check if admin already exists
    const [existing] = await connection.query(
      'SELECT id FROM admins WHERE username = ?',
      ['admin']
    );

    if (existing.length > 0) {
      console.log('[SeedAdmin] Admin user already exists, skipping creation.');
      return;
    }

    // Create default super admin
    const passwordHash = await bcrypt.hash('admin123', 10);

    await connection.query(
      `INSERT INTO admins (username, password_hash, real_name, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', passwordHash, '超级管理员', '13800000001', 'super_admin']
    );

    console.log('[SeedAdmin] Default super admin created successfully!');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  IMPORTANT: Change the password after first login!');
  } catch (err) {
    console.error('[SeedAdmin] Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedAdmin();
