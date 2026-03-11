const Product = require('../models/Product');
const Sale = require('../models/Sale');
const lineService = require('../services/lineService');

exports.renderPOS = async (req, res) => {
    try {
        const products = await Product.find({ stock: { $gt: 0 } }).sort({ name: 1 });

        // Group products by category
        const groupedProducts = products.reduce((acc, product) => {
            const category = product.category || 'อื่นๆ (Others)';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {});

        res.render('pos', {
            title: 'บันทึกการขาย (POS)',
            user: req.session,
            products,
            groupedProducts,
            error: null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error(err);
        res.render('pos', {
            title: 'บันทึกการขาย (POS)',
            user: req.session,
            products: [],
            error: 'ระบบไม่สามารถดึงข้อมูลสินค้าได้'
        });
    }
};

exports.processSale = async (req, res) => {
    try {
        const { cart } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ success: false, message: 'ไม่มีสินค้าออเดอร์ในตะกร้า' });
        }

        let totalAmount = 0;
        let totalWeight = 0;
        const items = [];
        const lowStockAlerts = [];

        // Verifying and preparing items logic
        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            const product = await Product.findById(item.productId);

            if (!product) continue;

            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `สินค้า ${product.name} มีสต็อกไม่เพียงพอ` });
            }

            const subTotal = product.price * item.quantity;
            totalAmount += subTotal;

            let saleWeight = 0;
            if (product.weight > 0) {
                if (['กิโลกรัม', 'กรัม', 'ขีด'].includes(product.unit)) {
                    // For weight-based items, quantity sold acts as weight 
                    saleWeight = item.quantity;
                } else {
                    // For piece-based items, calculate proportional weight sold
                    const previousStock = product.stock;
                    const weightPerUnit = previousStock > 0 ? (product.weight / previousStock) : 0;
                    saleWeight = weightPerUnit * item.quantity;
                }
            }

            totalWeight += saleWeight;

            items.push({
                product: product._id,
                quantity: item.quantity,
                priceAtSale: product.price,
                subTotal: subTotal,
                weightAtSale: saleWeight
            });

            // Deduct stock and weight
            product.stock -= item.quantity;
            if (product.weight > 0) {
                // To avoid floating point issues, limit to 2 decimal places manually or just use Math.max
                product.weight = Math.max(0, product.weight - saleWeight);
                // Fix to 2 decimal points roughly
                product.weight = Math.round(product.weight * 100) / 100;
            }
            await product.save();

            if (product.stock <= 5) {
                lowStockAlerts.push(product);
            }
        }

        const sale = new Sale({
            items,
            totalAmount,
            totalWeight,
            soldBy: req.session.userId
        });

        await sale.save();

        // Fire notifications asynchronously
        lineService.notifyNewSale(totalAmount, items.length, req.session.username);

        for (const prod of lowStockAlerts) {
            lineService.notifyLowStock(prod);
        }

        res.json({ success: true, message: 'บันทึกการขายสำเร็จ', saleId: sale._id });
    } catch (err) {
        console.error('Sale error:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกการขาย' });
    }
};

exports.renderHistory = async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate('soldBy', 'username')
            .populate('items.product', 'name code')
            .sort({ date: -1 });

        res.render('history', {
            title: 'ประวัติการขาย (Sales History)',
            user: req.session,
            sales
        });
    } catch (err) {
        console.error('History error:', err);
        res.status(500).send('Server Error: ไม่สามารถดึงข้อมูลประวัติการขายได้');
    }
};
