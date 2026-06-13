/**
 * Mock Bike Location Script.
 * Simulates real-time bike movement by randomly updating bike coordinates
 * every 10 seconds. Updates MySQL and refreshes Redis cache.
 *
 * Usage: node src/scripts/mockBikeLocation.js
 *
 * Only updates bikes that are 'available' or 'in_use' (not repairing/scrapped).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mysql = require('mysql2/promise');
const Redis = require('ioredis');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'bike_admin_2024',
  database: process.env.DB_NAME || 'shared_bike',
};

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

let pool;
let redis;

async function initialize() {
  pool = mysql.createPool(DB_CONFIG);
  redis = new Redis(REDIS_CONFIG);

  await redis.on('connect', () => console.log('[MockLocation] Redis connected'));
  console.log('[MockLocation] Initialized. Updating bikes every 10 seconds...');
}

/**
 * Update random bikes' locations by small random offsets.
 * Moves ~25% of active bikes by ±0.0005 degrees (~50m) in any direction.
 */
async function updateRandomBikes() {
  try {
    // Get all active bikes (available + in_use)
    const [bikes] = await pool.query(
      "SELECT id, latitude, longitude, status FROM bikes WHERE status IN ('available', 'in_use')"
    );

    if (bikes.length === 0) {
      console.log('[MockLocation] No active bikes to update');
      return;
    }

    // Pick random ~25% of active bikes
    const count = Math.max(1, Math.floor(bikes.length * 0.25));
    const shuffled = bikes.sort(() => 0.5 - Math.random());
    const toUpdate = shuffled.slice(0, count);

    const now = new Date();

    for (const bike of toUpdate) {
      // Random offset: ±0.0005 degrees (~50m)
      // Cast to Number: mysql2 returns DECIMAL columns as strings by default
      const newLat = Number(bike.latitude) + (Math.random() - 0.5) * 0.001;
      const newLng = Number(bike.longitude) + (Math.random() - 0.5) * 0.001;

      // Update bike position
      await pool.query(
        'UPDATE bikes SET latitude = ?, longitude = ? WHERE id = ?',
        [newLat, newLng, bike.id]
      );

      // Log the location change
      await pool.query(
        'INSERT INTO bike_location_log (bike_id, latitude, longitude, recorded_at) VALUES (?, ?, ?, ?)',
        [bike.id, newLat, newLng, now]
      );
    }

    // Refresh Redis cache with all locations
    const [allLocations] = await pool.query(
      "SELECT id, bike_no, latitude, longitude, status, battery_level FROM bikes WHERE status != 'scrapped'"
    );
    await redis.set('bike:locations', JSON.stringify(allLocations), 'EX', 10);

    // Also invalidate dashboard cache
    await redis.del('dashboard:overview');

    console.log(`[MockLocation] Updated ${toUpdate.length}/${bikes.length} bikes at ${now.toLocaleTimeString()}`);
  } catch (err) {
    console.error('[MockLocation] Error updating bikes:', err.message);
  }
}

// --- Main ---
initialize().then(() => {
  // Run immediately, then every 10 seconds
  updateRandomBikes();
  setInterval(updateRandomBikes, 10000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[MockLocation] Shutting down...');
  clearInterval(updateRandomBikes);
  if (redis) await redis.quit();
  if (pool) await pool.end();
  process.exit(0);
});
