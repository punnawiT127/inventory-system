const StockRequest = require('../models/StockRequest');
const Product = require('../models/Product');
const lineService = require('../services/lineService');

exports.getRequests = async (req, res) => {
    try {
        const requests = await StockRequest.find()
            .populate('product', 'name code stock unit')
            .populate('requestedBy', 'username name')
            .populate('resolvedBy', 'username name')
            .sort({ requestDate: -1 });

        res.render('requests', {
            title: 'คำร้องขอ (Requests)',
            user: req.session,
            requests,
            error: null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('Error fetching requests:', err);
        res.render('requests', {
            title: 'คำร้องขอ (Requests)',
            user: req.session,
            requests: [],
            error: 'ไม่สามารถโหลดข้อมูลคำร้องขอได้',
            success: null
        });
    }
};

exports.submitRequest = async (req, res) => {
    try {
        const { productId, oldStock, newStock, reason } = req.body;
        
        // Find product to ensure it exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.json({ success: false, message: 'ไม่พบสินค้า' });
        }
        
        // Update product stock immediately so that storefront/POS sees the correct amount
        const stockDiff = newStock - oldStock;
        product.stock = newStock;
        if (product.weight > 0 && ['กิโลกรัม', 'กรัม', 'ขีด'].includes(product.unit)) {
            product.weight = Math.max(0, product.weight + stockDiff);
            product.weight = Math.round(product.weight * 100) / 100;
        }
        await product.save();
        
        const request = new StockRequest({
            product: productId,
            requestedBy: req.session.userId,
            oldStock,
            newStock,
            reason: reason || '',
            status: 'Pending'
        });
        
        await request.save();
        
        // Send LINE notification for new request
        lineService.notifyNewRequest(product, req.session.username, oldStock, newStock, reason);
        
        res.json({ success: true, message: 'ส่งคำร้องขออนุมัติเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Error submitting request:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งคำร้อง' });
    }
};

exports.resolveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        
        const request = await StockRequest.findById(id).populate('product');
        if (!request) {
            return res.redirect('/requests?error=ไม่พบคำร้องขอ');
        }
        
        if (request.status !== 'Pending') {
            return res.redirect('/requests?error=คำร้องขอนี้ถูกจัดการไปแล้ว');
        }
        
        if (action === 'approve') {
            request.status = 'Approved';
            // Stock is already updated in DB upon submission, so nothing more is needed for product stock
        } else if (action === 'reject') {
            request.status = 'Rejected';
            // Revert the stock change
            if (request.product) {
                const stockDiff = request.oldStock - request.newStock; // difference to add back
                request.product.stock = Math.max(0, request.product.stock + stockDiff);
                if (request.product.weight > 0 && ['กิโลกรัม', 'กรัม', 'ขีด'].includes(request.product.unit)) {
                    request.product.weight = Math.max(0, request.product.weight + stockDiff);
                    request.product.weight = Math.round(request.product.weight * 100) / 100;
                }
                await request.product.save();
            }
        } else {
            return res.redirect('/requests?error=การดำเนินการไม่ถูกต้อง');
        }
        
        request.resolvedDate = Date.now();
        request.resolvedBy = req.session.userId;
        await request.save();
        
        res.redirect(`/requests?success=อัปเดตคำร้องขอเรียบร้อยแล้ว`);
    } catch (err) {
        console.error('Error resolving request:', err);
        res.redirect('/requests?error=เกิดข้อผิดพลาดในการจัดการคำร้อง');
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const count = await StockRequest.countDocuments({ status: 'Pending' });
        res.json({ success: true, count });
    } catch (err) {
        console.error('Error counting pending requests:', err);
        res.status(500).json({ success: false, count: 0 });
    }
};
