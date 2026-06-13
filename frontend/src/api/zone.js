import request from './request';

export const getZones = () =>
  request.get('/zones');

export const getZoneById = (id) =>
  request.get(`/zones/${id}`);

export const createZone = (data) =>
  request.post('/zones', data);

export const updateZone = (id, data) =>
  request.put(`/zones/${id}`, data);

export const deleteZone = (id) =>
  request.delete(`/zones/${id}`);

export const getBikesInZone = (id) =>
  request.get(`/zones/${id}/bikes`);

export const checkPoint = (lat, lng) =>
  request.post('/zones/check-point', { lat, lng });
