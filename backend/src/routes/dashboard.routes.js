const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dashboard.controller');

router.get('/overview', auth, ctrl.overview);
router.get('/ride-trend', auth, ctrl.rideTrend);
router.get('/revenue-trend', auth, ctrl.revenueTrend);
router.get('/status-distribution', auth, ctrl.statusDistribution);
router.get('/fault-trend', auth, ctrl.faultTrend);

module.exports = router;
