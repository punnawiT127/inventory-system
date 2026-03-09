const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    priceAtSale: {
        type: Number,
        required: true,
        min: 0
    },
    subTotal: {
        type: Number,
        required: true,
        min: 0
    },
    weightAtSale: {
        type: Number,
        default: 0
    }
});

const saleSchema = new mongoose.Schema({
    items: [saleItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    totalWeight: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    soldBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
