import request from './request';

export const getWorkOrders = (params) =>
  request.get('/work-orders', { params });

export const getWorkOrderById = (id) =>
  request.get(`/work-orders/${id}`);

export const createWorkOrder = (data) =>
  request.post('/work-orders', data);

export const updateWorkOrder = (id, data) =>
  request.put(`/work-orders/${id}`, data);

export const assignWorkOrder = (id, assigneeId) =>
  request.patch(`/work-orders/${id}/assign`, { assigneeId });

export const updateWorkOrderStatus = (id, status, notes) =>
  request.patch(`/work-orders/${id}/status`, { status, notes });
