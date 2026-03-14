const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.renderDashboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateQuery = {};
        let isFiltered = false;

        if (startDate || endDate) {
            isFiltered = true;
            dateQuery.$gte = startDate ? new Date(startDate) : new Date(0);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery.$lte = end;
            }
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dateQuery.$gte = today;
        }

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        // Aggregate today's or filtered sales
        const filteredSales = await Sale.aggregate([
            { $match: { date: dateQuery } },
            { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]);

        const filteredTotal = filteredSales.length > 0 ? filteredSales[0].total : 0;
        const filteredCount = filteredSales.length > 0 ? filteredSales[0].count : 0;

        // Aggregate monthly sales
        const monthSales = await Sale.aggregate([
            { $match: { date: { $gte: firstDayOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const monthlyTotal = monthSales.length > 0 ? monthSales[0].total : 0;

        // Low Stock Products
        const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(10);

        // Recent Sales
        const recentSales = await Sale.find().populate('soldBy', 'username').sort({ date: -1 }).limit(5);

        // Top Selling Products (Lifetime) Note: Can be optimized for large databases.
        const topProducts = await Sale.aggregate([
            { $unwind: '$items' },
            { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productDetails' } },
            { $unwind: '$productDetails' }
        ]);

        res.render('dashboard', {
            title: 'หน้าหลัก (Dashboard)',
            user: req.session,
            filteredTotal,
            filteredCount,
            monthlyTotal,
            lowStockProducts,
            recentSales,
            topProducts,
            query: req.query,
            isFiltered
        });
    } catch (err) {
        console.error('Dashboard Error:', err);
        res.status(500).send('Error loading dashboard');
    }
};
