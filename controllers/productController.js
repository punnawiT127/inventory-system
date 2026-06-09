const Product = require('../models/Product');
const Category = require('../models/Category');
const lineService = require('../services/lineService');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        const categories = await Category.find().sort({ name: 1 });
        res.render('products', {
            title: 'คลังสินค้า',
            user: req.session,
            products,
            categories,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error(err);
        res.render('products', {
            title: 'คลังสินค้า',
            user: req.session,
            products: [],
            categories: [],
            error: 'ไม่สามารถโหลดข้อมูลสินค้าได้ (Error loading products)',
            success: null
        });
    }
};

// Add new product
exports.addProduct = async (req, res) => {
    try {
        const { code, name, category, customCategory, costPrice, price, stock, weight, unit } = req.body;

        // Check if code exists
        const existing = await Product.findOne({ code });
        if (existing) {
            lineService.notifyDuplicateBarcode(code, name, existing.name);
            return res.redirect('/products?error=รหัสสินค้านี้มีอยู่ในระบบแล้ว (Code already exists)');
        }

        let finalCategory = category;
        if (category === 'custom_other' && customCategory) {
            finalCategory = customCategory.trim().replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
            if (finalCategory) {
                const exists = await Category.findOne({ name: finalCategory });
                if (!exists) {
                    await Category.create({ name: finalCategory });
                }
            }
        }

        const newProduct = new Product({
            code, name, category: finalCategory, costPrice: costPrice || 0, price, stock, weight: weight || 0, unit: unit || 'ชิ้น'
        });

        if (['กิโลกรัม', 'กรัม', 'ขีด'].includes(newProduct.unit) && (!weight || weight == 0)) {
            newProduct.weight = newProduct.stock;
        }

        await newProduct.save();
        res.redirect('/products?success=เพิ่มสินค้าเรียบร้อยแล้ว (Product added)');
    } catch (err) {
        console.error(err);
        res.redirect('/products?error=เกิดข้อผิดพลาดในการเพิ่มสินค้า (Error adding product)');
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.session.userRole;

        // Only Owner/Admin can directly edit product info via this route
        if (userRole !== 'Owner' && userRole !== 'Admin') {
            return res.redirect('/products?error=ไม่มีสิทธิ์แก้ไขข้อมูลโดยตรง (Unauthorized)');
        }

        const { code, name, category, customCategory, costPrice, price, stock, weight, unit } = req.body;

        if (code) {
            const existing = await Product.findOne({ code, _id: { $ne: id } });
            if (existing) {
                lineService.notifyDuplicateBarcode(code, name, existing.name);
                return res.redirect(`/products?error=รหัสสินค้า '${code}' นี้ซ้ำกับสินค้าอื่นในระบบ (Barcode already exists)`);
            }
        }

        let finalCategory = category;
        if (category === 'custom_other' && customCategory) {
            finalCategory = customCategory.trim().replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
            if (finalCategory) {
                const exists = await Category.findOne({ name: finalCategory });
                if (!exists) {
                    await Category.create({ name: finalCategory });
                }
            }
        }

        const updateData = {
            name, category: finalCategory, costPrice: costPrice || 0, price, stock, weight: weight || 0, unit: unit || 'ชิ้น'
        };
        
        if (code) updateData.code = code;

        if (['กิโลกรัม', 'กรัม', 'ขีด'].includes(updateData.unit) && (!weight || weight == 0)) {
            updateData.weight = updateData.stock;
        }

        await Product.findByIdAndUpdate(id, updateData, { runValidators: true });

        res.redirect('/products?success=อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว (Product updated)');
    } catch (err) {
        console.error('Update Product Error:', err);
        res.redirect('/products?error=เกิดข้อผิดพลาดในการอัปเดตสินค้า (Error updating product)');
    }
};

// Delete product (Owner only handled by middleware in routes)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.redirect('/products?success=ระบบได้ลบสินค้าออกเรียบร้อยแล้ว (Product deleted)');
    } catch (err) {
        console.error(err);
        res.redirect('/products?error=เกิดข้อผิดพลาดในการลบสินค้า (Error deleting product)');
    }
};

// API Endpoint to fetch a product by code (for Barcode Scanner)
exports.getProductByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const product = await Product.findOne({ code });
        if (product) {
            res.json({ success: true, product });
        } else {
            res.json({ success: false, message: 'ไม่พบสินค้ารหัสนี้ในระบบ' });
        }
    } catch (err) {
        console.error('Error fetching product by code:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};
// Render dedicated scanner page
exports.renderScanner = async (req, res) => {
    res.render('scanner', {
        title: 'สแกนด่วน (Quick Scan)',
        user: req.session
    });
};

// Add product category manually (Owner/Admin only)
exports.addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.redirect('/products?error=กรุณาระบุชื่อหมวดหมู่');
        }
        const cleanedName = name.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
        if (!cleanedName) {
            return res.redirect('/products?error=ชื่อหมวดหมู่ไม่ถูกต้อง');
        }
        const existing = await Category.findOne({ name: cleanedName });
        if (existing) {
            return res.redirect('/products?error=หมวดหมู่นี้มีอยู่ในระบบแล้ว (Category already exists)');
        }
        await Category.create({ name: cleanedName });
        res.redirect('/products?success=เพิ่มหมวดหมู่สินค้าสำเร็จ (Category added)');
    } catch (err) {
        console.error('Add Category Error:', err);
        res.redirect('/products?error=เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่');
    }
};

// Render dedicated restock page
exports.getRestock = async (req, res) => {
    try {
        const products = await Product.find().sort({ name: 1 });
        
        // Group products by category
        const groupedProducts = products.reduce((acc, product) => {
            const category = product.category || 'อื่นๆ (Others)';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {});

        res.render('restock', {
            title: 'เพิ่มของลงสต็อก (Restock)',
            user: req.session,
            products,
            groupedProducts,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('Get Restock Page Error:', err);
        res.render('restock', {
            title: 'เพิ่มของลงสต็อก (Restock)',
            user: req.session,
            products: [],
            groupedProducts: {},
            error: 'ไม่สามารถโหลดข้อมูลสินค้าได้',
            success: null
        });
    }
};

// Process stock restock additions (called via POST API)
exports.processRestock = async (req, res) => {
    try {
        const { items, reason } = req.body; // items: [{ productId, quantity }]
        const userRole = req.session.userRole;
        const userId = req.session.userId;
        const username = req.session.username;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'ไม่มีสินค้าที่ต้องการเพิ่มสต็อก' });
        }

        const StockRequest = require('../models/StockRequest');
        const results = [];
        const isManager = (userRole === 'Owner' || userRole === 'Admin');

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            const quantityToAdd = parseInt(item.quantity, 10);
            if (isNaN(quantityToAdd) || quantityToAdd <= 0) continue;

            const oldStock = product.stock;
            const newStock = oldStock + quantityToAdd;

            if (isManager) {
                // Manager updates stock directly in DB
                product.stock = newStock;
                if (product.weight > 0 && ['กิโลกรัม', 'กรัม', 'ขีด'].includes(product.unit)) {
                    product.weight = product.weight + quantityToAdd;
                }
                await product.save();
                results.push({ name: product.name, status: 'Directly Updated', newStock });
            } else {
                // Staff updates stock immediately in DB, and submits request for approval
                product.stock = newStock;
                if (product.weight > 0 && ['กิโลกรัม', 'กรัม', 'ขีด'].includes(product.unit)) {
                    product.weight = product.weight + quantityToAdd;
                }
                await product.save();

                const request = new StockRequest({
                    product: product._id,
                    requestedBy: userId,
                    type: 'ADD',
                    oldStock,
                    newStock,
                    reason: reason || 'เพิ่มสินค้าลงสต็อก',
                    status: 'Pending'
                });
                await request.save();

                // Send LINE notification
                lineService.notifyNewRequest(product, username, oldStock, newStock, reason);
                results.push({ name: product.name, status: 'Pending Approval', newStock });
            }
        }

        res.json({ 
            success: true, 
            message: isManager ? 'บันทึกการเพิ่มสต็อกเรียบร้อยแล้ว' : 'ส่งคำร้องขออนุมัติเพิ่มสต็อกเรียบร้อยแล้ว สต็อกอัปเดตชั่วคราวรอยืนยัน',
            results 
        });
    } catch (err) {
        console.error('Process Restock Error:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการทำรายการเพิ่มสต็อก' });
    }
};
