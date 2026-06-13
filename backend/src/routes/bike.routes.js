const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/bike.controller');

// Map endpoint must come before /:id to avoid route conflict
router.get('/map/locations', auth, ctrl.mapLocations);

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role('super_admin', 'operator'), ctrl.create);
router.put('/:id', auth, role('super_admin', 'operator'), ctrl.update);
router.delete('/:id', auth, role('super_admin'), ctrl.delete);
router.patch('/:id/status', auth, role('super_admin', 'operator'), ctrl.updateStatus);
router.get('/:id/track', auth, ctrl.getTrack);

module.exports = router;
