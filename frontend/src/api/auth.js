import request from './request';

export const login = (username, password) =>
  request.post('/auth/login', { username, password });

export const logout = () =>
  request.post('/auth/logout');

export const getProfile = () =>
  request.get('/auth/profile');

export const changePassword = (oldPassword, newPassword) =>
  request.put('/auth/password', { oldPassword, newPassword });

export const getOperators = () =>
  request.get('/auth/operators');
