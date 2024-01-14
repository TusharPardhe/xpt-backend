const mongoose = require('mongoose');

const Approver = new mongoose.Schema({
    address: {
        type: String,
        required: [true, 'Address is mandatory'],
    },
});

module.exports = mongoose.model('Approver', Approver);
