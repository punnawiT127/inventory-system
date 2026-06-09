// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore || require('connect-mongo');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory-db';

// Trust proxy (needed for Render and secure cookies)
app.set('trust proxy', 1);

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Register webhook BEFORE raw body parsing so LINE SDK can verify signatures
const webhookRoute = require('./routes/webhook');
app.use('/webhook', webhookRoute);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const saleRoutes = require('./routes/sale');
const reportRoutes = require('./routes/report'); // Pre-wire report
const staffRoutes = require('./routes/staff');
const requestRoutes = require('./routes/request');

app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/', saleRoutes);
app.use('/', reportRoutes);
app.use('/', staffRoutes);
app.use('/', requestRoutes);

// Route Definitions (Will be added soon)
app.get('/', (req, res) => {
    if (req.session.userId) {
        if (req.session.userRole === 'Owner') {
            res.redirect('/dashboard');
        } else {
            res.redirect('/products');
        }
    } else {
        res.redirect('/login');
    }
});

// Port and DB Connection
const cleanAndPopulateCategories = async () => {
    try {
        const Product = require('./models/Product');
        const Category = require('./models/Category');
        
        // 1. Seed defaults if Category collection is empty
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            const defaultCategories = [
                'อาหารและของกิน',
                'เครื่องดื่ม',
                'ของใช้ในบ้าน',
                'ของใช้ส่วนตัว',
                'เครื่องปรุงอาหาร',
                'ของสด',
                'ของแช่แข็ง / แช่เย็น',
                'อาหารสัตว์',
                'สินค้าการเกษตร',
                'ของใช้เบ็ดเตล็ด'
            ];
            for (const name of defaultCategories) {
                await Category.create({ name });
            }
            console.log('[Migration] Seeded default categories.');
        }

        // 2. Strip emojis from existing products' categories and populate Category table
        const products = await Product.find({});
        let cleanCount = 0;
        for (let product of products) {
            if (product.category) {
                let cleaned = product.category.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
                if (cleaned !== product.category) {
                    product.category = cleaned;
                    await product.save();
                    cleanCount++;
                }

                // Ensure category exists in Category collection
                if (product.category) {
                    const exists = await Category.findOne({ name: product.category });
                    if (!exists) {
                        await Category.create({ name: product.category });
                    }
                }
            }
        }
        if (cleanCount > 0) {
            console.log(`[Migration] Cleaned category emojis for ${cleanCount} products.`);
        }
    } catch (err) {
        console.error('[Migration Error] Failed to clean categories:', err);
    }
};

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await cleanAndPopulateCategories();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });
