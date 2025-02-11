const mongoose = require('mongoose');

const Record = new mongoose.Schema({
    minterAddress: {
        type: String,
        required: [true, 'Address is mandatory'],
    },
    patientID: {
        type: String,
        required: [true, 'Patient ID is mandatory'],
    },
    name: {
        type: String,
        required: [true, 'Name is mandatory'],
    },
    txID: {
        type: String,
        required: [true, 'Transaction ID is mandatory'],
    },
});

module.exports = mongoose.model('Record', Record);
