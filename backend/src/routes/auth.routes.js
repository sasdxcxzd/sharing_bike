const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

// Public routes
router.post('/login', ctrl.login);
router.post('/register', ctrl.register);

// Protected routes (require valid JWT)
router.post('/logout', auth, ctrl.logout);
router.get('/profile', auth, ctrl.getProfile);
router.put('/password', auth, ctrl.changePassword);
router.get('/operators', auth, ctrl.getOperators);

module.exports = router;
