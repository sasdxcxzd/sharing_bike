const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/zone.controller');

// Check point must come before /:id
router.post('/check-point', auth, ctrl.checkPoint);

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role('super_admin'), ctrl.create);
router.put('/:id', auth, role('super_admin'), ctrl.update);
router.delete('/:id', auth, role('super_admin'), ctrl.delete);
router.get('/:id/bikes', auth, ctrl.getBikesInZone);

module.exports = router;
