const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/notification.controller');

router.get('/', auth, ctrl.list);
router.post('/', auth, role('super_admin'), ctrl.send);

module.exports = router;
