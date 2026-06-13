/**
 * Generate test ride data for the past N days.
 * Creates realistic ride patterns with randomized users, bikes, times.
 *
 * Usage:
 *   node src/scripts/generateTestRides.js [days=8] [ridesPerDay=15]
 *
 * Examples:
 *   node src/scripts/generateTestRides.js          # Default: 8 days, ~15 rides/day
 *   node src/scripts/generateTestRides.js 14 25     # 14 days, ~25 rides/day
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234567',
  database: process.env.DB_NAME || 'shared_bike',
};

async function generate(daysArg, ridesPerDayArg) {
  const days = parseInt(daysArg) || 8;
  const avgRides = parseInt(ridesPerDayArg) || 15;
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log(`[GenerateRides] Generating ~${avgRides} rides/day for ${days} days...`);

    // Get valid user and bike IDs
    const [users] = await connection.query('SELECT id FROM users WHERE status = 1');
    const userIds = users.map(u => u.id);

    const [bikes] = await connection.query("SELECT id FROM bikes WHERE status IN ('available','in_use','deployed')");
    const bikeIds = bikes.map(b => b.id);

    if (userIds.length === 0 || bikeIds.length === 0) {
      console.error('[GenerateRides] No users or bikes found. Run seed.sql first.');
      process.exit(1);
    }

    const baseLat = 39.915;
    const baseLng = 116.404;
    let inserted = 0;
    const today = new Date();

    for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
      const day = new Date(today);
      day.setDate(day.getDate() - dayOffset);
      const dayStr = day.toISOString().split('T')[0];
      const numRides = avgRides - 5 + Math.floor(Math.random() * 11); // ±5 variation

      for (let i = 0; i < numRides; i++) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const bikeId = bikeIds[Math.floor(Math.random() * bikeIds.length)];
        const orderNo = 'RO' + dayStr.replace(/-/g, '') + String(i).padStart(3, '0');

        const startH = 6 + Math.floor(Math.random() * 16); // 6:00 - 21:59
        const startM = Math.floor(Math.random() * 60);
        const startTime = new Date(day);
        startTime.setHours(startH, startM, 0, 0);

        const duration = 300 + Math.floor(Math.random() * 2400); // 5-45 min
        const endTime = new Date(startTime.getTime() + duration * 1000);

        const startLat = baseLat + (Math.random() - 0.5) * 0.02;
        const startLng = baseLng + (Math.random() - 0.5) * 0.02;
        const endLat = startLat + (Math.random() - 0.5) * 0.01;
        const endLng = startLng + (Math.random() - 0.5) * 0.01;

        // 10% active (today only), 5% cancelled, 85% completed
        const rand = Math.random();
        let status, payment = 1;
        if (rand < 0.10 && dayOffset === 0) {
          status = 'active';
          payment = 0;
        } else if (rand < 0.15) {
          status = 'cancelled';
          payment = 0;
        } else {
          status = 'completed';
        }

        try {
          await connection.query(
            `INSERT IGNORE INTO ride_orders
             (order_no, user_id, bike_id, start_time, end_time,
              start_lat, start_lng, end_lat, end_lng,
              duration_seconds, fee, status, payment_status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              orderNo, userId, bikeId, startTime,
              status === 'active' ? null : endTime,
              startLat, startLng,
              status === 'active' ? null : endLat,
              status === 'active' ? null : endLng,
              status === 'active' ? null : duration,
              1.50, status, payment,
            ]
          );
          inserted++;
        } catch (e) {
          // skip duplicates (order_no unique constraint)
        }
      }
    }

    console.log(`[GenerateRides] Done: ${inserted} new ride orders inserted.`);
  } catch (err) {
    console.error('[GenerateRides] Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

generate(process.argv[2], process.argv[3]);
