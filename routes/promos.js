const router = require('express').Router();
const ctrl = require('../controllers/promoController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, ctrl.list);
router.post('/validate', ctrl.validate);
router.post('/', protect, admin, ctrl.create);
router.put('/:id', protect, admin, ctrl.update);
router.delete('/:id', protect, admin, ctrl.delete);

module.exports = router;
