const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth, requireOwner } = require('../controllers/authController');

// Using requireOwner ensures only Owner users can access dashboard stats
router.get('/dashboard', requireOwner, reportController.renderDashboard);

module.exports = router;
