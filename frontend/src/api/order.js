import request from './request';

export const getOrders = (params) =>
  request.get('/orders', { params });

export const getOrderById = (id) =>
  request.get(`/orders/${id}`);

export const getOrderStats = () =>
  request.get('/orders/stats/summary');
