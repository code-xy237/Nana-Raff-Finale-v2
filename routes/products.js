const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/stats', protect, admin, ctrl.stats);
router.get('/:id', ctrl.get);
router.post('/', protect, admin, ctrl.create);
router.put('/:id', protect, admin, ctrl.update);
router.delete('/:id', protect, admin, ctrl.delete);

module.exports = router;
