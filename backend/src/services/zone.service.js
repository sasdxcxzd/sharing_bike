/**
 * Operating Zone service - Business logic for geofence zone management.
 */
const zoneModel = require('../models/operatingZone.model');
const bikeModel = require('../models/bike.model');
const geoUtil = require('../utils/geo');
const redis = require('../config/redis');

module.exports = {
  /** List all operating zones */
  async list() {
    return zoneModel.findAll();
  },

  /** Get zone detail with boundary coordinates parsed */
  async getById(id) {
    const zone = await zoneModel.findById(id);
    if (!zone) {
      throw Object.assign(new Error('运营区域不存在'), { statusCode: 404 });
    }

    // Parse WKT polygon to coordinate array for the frontend
    if (zone.boundary_wkt) {
      zone.polygon = parseWktPolygon(zone.boundary_wkt);
    }

    return zone;
  },

  /** Create a new operating zone */
  async create({ name, city, district, polygon, maxBikes }) {
    // Calculate center from polygon
    let centerLat = 0, centerLng = 0;
    if (polygon && polygon.length > 0) {
      polygon.forEach(p => { centerLat += p.lat; centerLng += p.lng; });
      centerLat /= polygon.length;
      centerLng /= polygon.length;
    }

    // Calculate approximate radius
    let radiusM = 0;
    if (polygon && polygon.length > 0) {
      polygon.forEach(p => {
        const d = geoUtil.haversineDistance(centerLat, centerLng, p.lat, p.lng);
        if (d > radiusM) radiusM = d;
      });
    }

    // Ensure polygon ring is closed (first vertex must equal last vertex)
    if (polygon.length > 0) {
      const first = polygon[0];
      const last = polygon[polygon.length - 1];
      if (Math.abs(first.lat - last.lat) > 0.000001 || Math.abs(first.lng - last.lng) > 0.000001) {
        polygon.push({ lat: first.lat, lng: first.lng });
      }
    }

    // Convert polygon array to WKT (MySQL uses lng lat order)
    const wktCoords = polygon.map(p => `${p.lng} ${p.lat}`).join(', ');
    const polygonText = `POLYGON((${wktCoords}))`;

    const id = await zoneModel.create({
      name,
      city,
      district: district || null,
      polygonText,
      centerLat,
      centerLng,
      radiusM: Math.round(radiusM),
      maxBikes,
    });

    return zoneModel.findById(id);
  },

  /** Update an operating zone */
  async update(id, fields) {
    const zone = await zoneModel.findById(id);
    if (!zone) {
      throw Object.assign(new Error('运营区域不存在'), { statusCode: 404 });
    }

    // If polygon provided, convert to WKT
    if (fields.polygon) {
      const wktCoords = fields.polygon.map(p => `${p.lng} ${p.lat}`).join(', ');
      fields.polygonText = `POLYGON((${wktCoords}))`;
      delete fields.polygon;
    }

    await zoneModel.update(id, fields);
    return zoneModel.findById(id);
  },

  /** Delete an operating zone */
  async deleteZone(id) {
    const zone = await zoneModel.findById(id);
    if (!zone) {
      throw Object.assign(new Error('运营区域不存在'), { statusCode: 404 });
    }
    await zoneModel.deleteById(id);
  },

  /** Get bikes inside a specific zone */
  async getBikesInZone(zoneId) {
    const zone = await zoneModel.findById(zoneId);
    if (!zone) {
      throw Object.assign(new Error('运营区域不存在'), { statusCode: 404 });
    }

    const bikes = await bikeModel.findByZoneId(zoneId);
    return bikes;
  },

  /**
   * Check if a point is inside any active operating zone.
   * Uses MySQL spatial query for accuracy.
   */
  async checkPoint(lat, lng) {
    const zones = await zoneModel.findZonesContainingPoint(lat, lng);
    return {
      inZone: zones.length > 0,
      zones,
      point: { lat, lng },
    };
  },
};

/**
 * Parse a WKT POLYGON string to an array of {lat, lng} objects.
 * Example input: "POLYGON((116.45 39.92, 116.50 39.92, 116.50 39.95, 116.45 39.95, 116.45 39.92))"
 */
function parseWktPolygon(wkt) {
  if (!wkt) return [];

  const match = wkt.match(/POLYGON\(\((.+)\)\)/);
  if (!match) return [];

  return match[1].split(',').map(pair => {
    const [lng, lat] = pair.trim().split(/\s+/).map(Number);
    return { lat, lng };
  });
}
