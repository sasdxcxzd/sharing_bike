import request from './request';

export const getOverview = () =>
  request.get('/dashboard/overview');

export const getRideTrend = (days = 7) =>
  request.get('/dashboard/ride-trend', { params: { days } });

export const getRevenueTrend = (days = 7) =>
  request.get('/dashboard/revenue-trend', { params: { days } });

export const getStatusDistribution = () =>
  request.get('/dashboard/status-distribution');

export const getFaultTrend = (days = 30) =>
  request.get('/dashboard/fault-trend', { params: { days } });
