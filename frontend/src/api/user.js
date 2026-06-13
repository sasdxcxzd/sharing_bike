import request from './request';

export const getUsers = (params) =>
  request.get('/users', { params });

export const getUserById = (id) =>
  request.get(`/users/${id}`);

export const updateUserStatus = (id, status) =>
  request.put(`/users/${id}/status`, { status });
