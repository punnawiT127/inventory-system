const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { requireAuth } = require('../controllers/authController');

router.use(requireAuth);

router.get('/pos', saleController.renderPOS);
router.post('/api/sales', express.json(), saleController.processSale);

// Only Owners can view the full history
const { requireOwner } = require('../controllers/authController');
router.get('/history', requireOwner, saleController.renderHistory);

module.exports = router;
