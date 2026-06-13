const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/user.controller');

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getById);
router.put('/:id/status', auth, ctrl.updateStatus);

module.exports = router;
