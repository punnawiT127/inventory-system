const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.getStaff = async (req, res) => {
    try {
        const staffList = await User.find({ role: 'Staff' }).sort({ createdAt: -1 });
        res.render('staff', {
            title: 'จัดการพนักงาน (Staff Management)',
            user: req.session,
            staffList,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('Error fetching staff:', err);
        res.render('staff', {
            title: 'จัดการพนักงาน (Staff Management)',
            user: req.session,
            staffList: [],
            error: 'ไม่สามารถโหลดข้อมูลพนักงานได้',
            success: null
        });
    }
};

exports.addStaff = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.redirect('/staff?error=ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว (Username already exists)');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newStaff = new User({
            username,
            password: hashedPassword,
            role: 'Staff'
        });

        await newStaff.save();
        res.redirect('/staff?success=เพิ่มบัญชีพนักงานเรียบร้อยแล้ว');
    } catch (err) {
        console.error('Error adding staff:', err);
        res.redirect('/staff?error=เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(id, { password: hashedPassword });
        
        res.redirect('/staff?success=รีเซ็ตรหัสผ่านเรียบร้อยแล้ว');
    } catch (err) {
        console.error('Error resetting password:', err);
        res.redirect('/staff?error=เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.redirect('/staff?success=ลบบัญชีพนักงานเรียบร้อยแล้ว');
    } catch (err) {
        console.error('Error deleting staff:', err);
        res.redirect('/staff?error=เกิดข้อผิดพลาดในการลบพนักงาน');
    }
};
