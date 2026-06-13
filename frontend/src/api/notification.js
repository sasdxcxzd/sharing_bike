import request from './request';

export const getNotifications = (params) =>
  request.get('/notifications', { params });

export const sendNotification = (data) =>
  request.post('/notifications', data);
