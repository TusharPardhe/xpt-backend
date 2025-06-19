const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, 'Username is mandatory'],
        unique: true,
    },
    address: {
        type: String,
        required: [true, 'XRPL address is mandatory'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is mandatory'],
    },
    type: {
        type: String,
        required: [true, 'Password is mandatory'],
        default: 'USER',
    },
    pushTokens: [
        {
            token: String,
            deviceId: String,
            platform: String, // 'ios' or 'android'
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

UserSchema.pre('save', async function (next) {
    try {
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(this.password, salt);
        this.password = passwordHash;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('UserSchema', UserSchema);
