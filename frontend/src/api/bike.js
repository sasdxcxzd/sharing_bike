import request from './request';

export const getBikes = (params) =>
  request.get('/bikes', { params });

export const getBikeById = (id) =>
  request.get(`/bikes/${id}`);

export const createBike = (data) =>
  request.post('/bikes', data);

export const updateBike = (id, data) =>
  request.put(`/bikes/${id}`, data);

export const deleteBike = (id) =>
  request.delete(`/bikes/${id}`);

export const updateBikeStatus = (id, status) =>
  request.patch(`/bikes/${id}/status`, { status });

export const getMapLocations = () =>
  request.get('/bikes/map/locations');

export const getBikeTrack = (id) =>
  request.get(`/bikes/${id}/track`);
