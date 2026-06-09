const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth, requireOwner, requireAdminOrOwner } = require('../controllers/authController');

// All product routes require authentication
router.use(requireAuth);

router.get('/products', productController.getProducts);
router.get('/scanner', productController.renderScanner);
router.post('/products/add', productController.addProduct);
router.post('/products/update/:id', productController.updateProduct);

// Category Management
router.post('/products/category/add', requireAdminOrOwner, productController.addCategory);

// Restock Routes
router.get('/restock', productController.getRestock);
router.post('/api/products/restock', express.json(), productController.processRestock);

// API Routes (Frontend JS requests)
router.get('/api/products/:code', productController.getProductByCode);

// Only owner can delete products
router.post('/products/delete/:id', requireOwner, productController.deleteProduct);

module.exports = router;
