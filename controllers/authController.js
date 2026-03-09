const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.renderLogin = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (Invalid username or password)' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (Invalid username or password)' });
        }

        // Set session
        req.session.userId = user._id;
        req.session.userRole = user.role;
        req.session.username = user.username;

        if (user.role === 'Owner') {
            res.redirect('/dashboard');
        } else {
            res.redirect('/products');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'เกิดข้อผิดพลาดของระบบ (System error)' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
};

// Middleware to protect routes
exports.requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Middleware for Owner specific routes
exports.requireOwner = (req, res, next) => {
    if (!req.session.userId || req.session.userRole !== 'Owner') {
        return res.status(403).send('Forbidden: สิทธิ์การเข้าถึงสำหรับ Owner เท่านั้น');
    }
    next();
};
