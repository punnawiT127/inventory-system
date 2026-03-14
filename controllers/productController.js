const Product = require('../models/Product');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('products', {
            title: 'คลังสินค้า',
            user: req.session,
            products,
            error: null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error(err);
        res.render('products', {
            title: 'คลังสินค้า',
            user: req.session,
            products: [],
            error: 'ไม่สามารถโหลดข้อมูลสินค้าได้ (Error loading products)',
            success: null
        });
    }
};

// Add new product
exports.addProduct = async (req, res) => {
    try {
        const { code, name, category, price, stock, weight, unit } = req.body;

        // Check if code exists
        const existing = await Product.findOne({ code });
        if (existing) {
            return res.redirect('/products?error=รหัสสินค้านี้มีอยู่ในระบบแล้ว (Code already exists)');
        }

        const newProduct = new Product({
            code, name, category, price, stock, weight: weight || 0, unit: unit || 'ชิ้น'
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
        const { code, name, category, price, stock, weight, unit } = req.body;

        if (code) {
            const existing = await Product.findOne({ code, _id: { $ne: id } });
            if (existing) {
                return res.redirect(`/products?error=รหัสสินค้า '${code}' นี้ซ้ำกับสินค้าอื่นในระบบ (Barcode already exists)`);
            }
        }

        const updateData = {
            code, name, category, price, stock, weight: weight || 0, unit: unit || 'ชิ้น'
        };

        if (['กิโลกรัม', 'กรัม', 'ขีด'].includes(updateData.unit) && (!weight || weight == 0)) {
            updateData.weight = updateData.stock;
        }

        await Product.findByIdAndUpdate(id, updateData);

        res.redirect('/products?success=อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว (Product updated)');
    } catch (err) {
        console.error(err);
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
