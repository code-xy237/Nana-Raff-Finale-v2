const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { protect, admin, optionalAuth } = require('../middleware/auth');

router.get('/stats', protect, admin, ctrl.stats);
router.get('/', protect, ctrl.list);
router.get('/:id', protect, ctrl.get);
router.post('/', optionalAuth, ctrl.create);
router.patch('/:id/status', protect, admin, ctrl.updateStatus);

module.exports = router;
