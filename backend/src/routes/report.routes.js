const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/report.controller');

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getById);
router.put('/:id/review', auth, ctrl.review);

module.exports = router;
