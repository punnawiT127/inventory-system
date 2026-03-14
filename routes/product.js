const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth, requireOwner } = require('../controllers/authController');

// All product routes require authentication
router.use(requireAuth);

router.get('/products', productController.getProducts);
router.post('/products/add', productController.addProduct);
router.post('/products/update/:id', productController.updateProduct);
// API Routes (Frontend JS requests)
router.get('/api/products/:code', productController.getProductByCode);

// Only owner can delete products
router.post('/products/delete/:id', requireOwner, productController.deleteProduct);

module.exports = router;
