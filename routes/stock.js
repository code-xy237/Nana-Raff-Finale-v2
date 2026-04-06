const router = require('express').Router();
const ctrl = require('../controllers/stockController');
const { protect, admin } = require('../middleware/auth');

// IMPORTANT: /export avant /:id
router.get('/export', protect, admin, ctrl.exportStockExcel);
router.get('/', protect, admin, ctrl.getStockOverview);
router.patch('/:id', protect, admin, ctrl.updateStock);

module.exports = router;
