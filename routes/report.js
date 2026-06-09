const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth, requireOwner, requireAdminOrOwner } = require('../controllers/authController');

// Using requireAdminOrOwner ensures Owner/Admin users can access dashboard stats
router.get('/dashboard', requireAdminOrOwner, reportController.renderDashboard);

// Daily summary for LINE OA or mobile quick check
router.get('/reports/today', requireAdminOrOwner, reportController.renderDailySummary);

module.exports = router;
