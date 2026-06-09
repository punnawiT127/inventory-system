const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { requireAuth, requireOwner, requireAdminOrOwner } = require('../controllers/authController');

// All request routes require authentication
router.use(requireAuth);

// Owner and Admin can view and resolve requests
router.get('/requests', requireAdminOrOwner, requestController.getRequests);
router.post('/requests/resolve/:id', requireAdminOrOwner, requestController.resolveRequest);

// API route for employees to submit a request
router.post('/api/requests/submit', express.json(), requestController.submitRequest);

// API route for frontend badge notification
router.get('/api/requests/count-pending', requireAdminOrOwner, requestController.getPendingCount);

module.exports = router;
