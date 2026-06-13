const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/order.controller');

// Stats endpoint must come before /:id
router.get('/stats/summary', auth, ctrl.statsSummary);

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getById);

module.exports = router;
