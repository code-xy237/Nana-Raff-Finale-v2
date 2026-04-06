const router = require('express').Router();
const ctrl = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/auth');

router.get('/list', protect, admin, ctrl.listInvoices);
router.get('/:orderId/pdf', protect, admin, ctrl.getInvoicePDF);
router.get('/:orderId/excel', protect, admin, ctrl.getInvoiceExcel);

module.exports = router;