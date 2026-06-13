/**
 * Operating Zone model - Database queries for operating_zones table.
 * Uses MySQL spatial functions for geofence operations.
 */
const pool = require('../config/db');

module.exports = {
  /** List all zones */
  async findAll() {
    const [rows] = await pool.query(
      `SELECT id, name, city, district, ST_AsText(boundary) as boundary_wkt,
        center_lat, center_lng, radius_m, status, max_bikes, created_at
       FROM operating_zones
       ORDER BY created_at DESC`
    );
    return rows;
  },

  /** Find zone by ID */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, city, district, ST_AsText(boundary) as boundary_wkt,
        center_lat, center_lng, radius_m, status, max_bikes, created_at
       FROM operating_zones
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new operating zone with polygon boundary */
  async create({ name, city, district, polygonText, centerLat, centerLng, radiusM, maxBikes }) {
    const [result] = await pool.query(
      `INSERT INTO operating_zones (name, city, district, boundary, center_lat, center_lng, radius_m, max_bikes)
       VALUES (?, ?, ?, ST_GeomFromText(?), ?, ?, ?, ?)`,
      [name, city, district, polygonText, centerLat, centerLng, radiusM, maxBikes || 500]
    );
    return result.insertId;
  },

  /** Update an operating zone */
  async update(id, fields) {
    const sets = [];
    const params = [];

    if (fields.name) { sets.push('name = ?'); params.push(fields.name); }
    if (fields.city) { sets.push('city = ?'); params.push(fields.city); }
    if (fields.district) { sets.push('district = ?'); params.push(fields.district); }
    if (fields.polygonText) { sets.push('boundary = ST_GeomFromText(?)'); params.push(fields.polygonText); }
    if (fields.centerLat) { sets.push('center_lat = ?'); params.push(fields.centerLat); }
    if (fields.centerLng) { sets.push('center_lng = ?'); params.push(fields.centerLng); }
    if (fields.radiusM) { sets.push('radius_m = ?'); params.push(fields.radiusM); }
    if (fields.maxBikes !== undefined) { sets.push('max_bikes = ?'); params.push(fields.maxBikes); }
    if (fields.status !== undefined) { sets.push('status = ?'); params.push(fields.status); }

    if (sets.length === 0) return 0;

    params.push(id);
    const [result] = await pool.query(`UPDATE operating_zones SET ${sets.join(', ')} WHERE id = ?`, params);
    return result.affectedRows;
  },

  /** Delete an operating zone */
  async deleteById(id) {
    const [result] = await pool.query('DELETE FROM operating_zones WHERE id = ?', [id]);
    return result.affectedRows;
  },

  /** Check if a point is inside a specific zone using MySQL spatial function */
  async checkPointInZone(zoneId, lat, lng) {
    const [rows] = await pool.query(
      'SELECT ST_Contains(boundary, ST_GeomFromText(?)) as is_inside FROM operating_zones WHERE id = ?',
      [`POINT(${lng} ${lat})`, zoneId]
    );
    return rows[0]?.is_inside === 1;
  },

  /** Find which zones contain a given point */
  async findZonesContainingPoint(lat, lng) {
    const [rows] = await pool.query(
      `SELECT id, name, city, district
       FROM operating_zones
       WHERE status = 1 AND ST_Contains(boundary, ST_GeomFromText(?))`,
      [`POINT(${lng} ${lat})`]
    );
    return rows;
  },
};
