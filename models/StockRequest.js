const mongoose = require('mongoose');

const stockRequestSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['ADD', 'UPDATE'],
        default: 'UPDATE'
    },
    oldStock: {
        type: Number,
        required: true
    },
    newStock: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    reason: {
        type: String,
        trim: true
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    resolvedDate: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('StockRequest', stockRequestSchema);
