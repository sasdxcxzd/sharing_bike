const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/workOrder.controller');

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role('super_admin', 'operator'), ctrl.create);
router.put('/:id', auth, role('super_admin', 'operator'), ctrl.update);
router.patch('/:id/assign', auth, role('super_admin', 'operator'), ctrl.assign);
router.patch('/:id/status', auth, role('super_admin', 'operator'), ctrl.updateStatus);

module.exports = router;
