const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth, requireOwner } = require('../controllers/authController');

// Using requireOwner ensures only Owner users can access dashboard stats
router.get('/dashboard', requireOwner, reportController.renderDashboard);

// Daily summary for LINE OA or mobile quick check
router.get('/reports/today', requireOwner, reportController.renderDailySummary);

module.exports = router;
