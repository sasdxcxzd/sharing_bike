import request from './request';

export const getReports = (params) =>
  request.get('/reports', { params });

export const getReportById = (id) =>
  request.get(`/reports/${id}`);

export const reviewReport = (id, data) =>
  request.put(`/reports/${id}/review`, data);
