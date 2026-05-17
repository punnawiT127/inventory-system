const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { requireAuth, requireOwner } = require('../controllers/authController');

// All request routes require authentication
router.use(requireAuth);

// Only owner can view and resolve requests
router.get('/requests', requireOwner, requestController.getRequests);
router.post('/requests/resolve/:id', requireOwner, requestController.resolveRequest);

// API route for employees to submit a request
router.post('/api/requests/submit', express.json(), requestController.submitRequest);

// API route for frontend badge notification
router.get('/api/requests/count-pending', requireOwner, requestController.getPendingCount);

module.exports = router;
