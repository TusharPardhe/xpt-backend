const mongoose = require('mongoose');

const Escrow = new mongoose.Schema({
    address: {
        type: String,
        required: [true, 'Address is mandatory'],
    },
    id: {
        type: String,
        required: [true, 'Escrow ID is mandatory'],
    },
    txs: {
        type: Array,
        required: [true, 'Transaction data missing.'],
        default: [],
    },
    completed: {
        type: Boolean,
        default: false,
    },
    time: {
        type: Date,
        // Default after 3 years
        default: Date.now() + 94608000,
    },
    createdBy: {
        type: String,
        required: [true, 'Created by is mandatory'],
    },
    approvedBy: {
        // Array of addresses
        type: Array,
        required: [true, 'Approved by is mandatory'],
    },
});

module.exports = mongoose.model('Escrow', Escrow);
