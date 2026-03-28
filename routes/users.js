const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, ctrl.list);
router.get('/stats', protect, admin, ctrl.stats);
router.get('/:id', protect, admin, ctrl.get);
router.put('/:id', protect, admin, ctrl.update);
router.delete('/:id', protect, admin, ctrl.delete);

module.exports = router;
