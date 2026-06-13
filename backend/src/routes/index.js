/**
 * Route aggregator - mounts all module routes under /api/v1
 */
const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/bikes', require('./bike.routes'));
router.use('/users', require('./user.routes'));
router.use('/orders', require('./order.routes'));
router.use('/work-orders', require('./workOrder.routes'));
router.use('/zones', require('./zone.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./report.routes'));
router.use('/notifications', require('./notification.routes'));

// API root - list available endpoints
router.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'Shared Bike Management API v1',
    endpoints: {
      health: 'GET /api/v1/health',
      auth: 'POST /api/v1/auth/login',
      bikes: 'GET /api/v1/bikes',
      users: 'GET /api/v1/users',
      orders: 'GET /api/v1/orders',
      'work-orders': 'GET /api/v1/work-orders',
      zones: 'GET /api/v1/zones',
      dashboard: 'GET /api/v1/dashboard',
      reports: 'GET /api/v1/reports',
      notifications: 'GET /api/v1/notifications',
    },
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ code: 200, message: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
