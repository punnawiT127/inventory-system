const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { requireAuth } = require('../controllers/authController');

router.use(requireAuth);

router.get('/pos', saleController.renderPOS);
router.post('/api/sales', express.json(), saleController.processSale);
router.get('/receipt/:id', saleController.renderReceipt);

// Owners and Admins can view the full history
const { requireAdminOrOwner } = require('../controllers/authController');
router.get('/history', requireAdminOrOwner, saleController.renderHistory);

module.exports = router;
