const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { requireOwner } = require('../controllers/authController');

// All staff routes require Owner privileges
router.use(requireOwner);

router.get('/staff', staffController.getStaff);
router.post('/staff/add', staffController.addStaff);
router.post('/staff/reset-password/:id', staffController.resetPassword);
router.post('/staff/delete/:id', staffController.deleteStaff);

module.exports = router;
