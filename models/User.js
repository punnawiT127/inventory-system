const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    passwordText: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['Owner', 'Admin', 'Staff'],
        default: 'Staff'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
