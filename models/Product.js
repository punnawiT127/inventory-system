const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'General'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    weight: {
        type: Number,
        min: 0,
        default: 0
    },
    unit: {
        type: String,
        default: 'ชิ้น'
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
