const mongoose = require('mongoose');

const WebConnectionSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        walletAddress: {
            type: String,
            required: false, // Will be set after user approves
            index: true,
        },
        deviceId: {
            type: String,
            required: false, // Will be set after user approves
        },
        websiteOrigin: {
            type: String,
            required: true,
        },
        websiteName: {
            type: String,
            required: true,
        },
        websiteIcon: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'expired'],
            default: 'pending',
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        approvedAt: {
            type: Date,
            required: false,
        },
        connectedAt: {
            type: Date,
            required: false,
        },
        lastActivity: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            userAgent: String,
            ipAddress: String,
            permissions: [
                {
                    type: String,
                    enum: ['read_balance', 'read_transactions', 'sign_transactions', 'read_account_info'],
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

// TTL index for automatic cleanup of expired sessions
WebConnectionSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for efficient queries
WebConnectionSessionSchema.index({ code: 1, status: 1 });
WebConnectionSessionSchema.index({ sessionId: 1, status: 1 });
WebConnectionSessionSchema.index({ walletAddress: 1, status: 1 });

module.exports = mongoose.model('WebConnectionSession', WebConnectionSessionSchema);
