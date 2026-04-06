const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// Routes fixes AVANT /:id (ordre critique)
router.get('/stats',          protect, admin, ctrl.stats);
router.get('/',               protect, admin, ctrl.list);
router.get('/:id',            protect, admin, ctrl.get);
router.put('/:id',            protect, admin, ctrl.update);
router.patch('/:id',          protect, admin, ctrl.update);
router.delete('/:id',         protect, admin, ctrl.delete);
router.post('/:id/reset-password', protect, admin, ctrl.resetPassword);

module.exports = router;
