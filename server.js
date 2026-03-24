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

app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/', saleRoutes);
app.use('/', reportRoutes);
app.use('/', staffRoutes);

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
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });
