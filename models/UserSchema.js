const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    address: {
        type: String,
        required: [true, 'XRPL address is mandatory'],
        unique: true,
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
    },
});

module.exports = mongoose.model('UserSchema', UserSchema);
