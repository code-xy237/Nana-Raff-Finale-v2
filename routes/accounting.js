const router = require('express').Router();
const ctrl = require('../controllers/accountingController');
const { protect, admin } = require('../middleware/auth');

router.get('/report', protect, admin, ctrl.getReport);
router.get('/export', protect, admin, ctrl.exportReport);

module.exports = router;
