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
        codeExpiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        connectionExpiresAt: {
            type: Date,
            required: false,
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
        disconnectedAt: {
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

// TTL index for automatic cleanup of expired auth codes only
// This index only applies to pending sessions and uses codeExpiresAt
WebConnectionSessionSchema.index(
    { codeExpiresAt: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: { 
            status: 'pending' // Only applies to pending sessions, not approved persistent ones
        },
    }
);

// Compound indexes for efficient queries
WebConnectionSessionSchema.index({ code: 1, status: 1 });
WebConnectionSessionSchema.index({ sessionId: 1, status: 1 });
WebConnectionSessionSchema.index({ walletAddress: 1, status: 1 });
WebConnectionSessionSchema.index({ walletAddress: 1, websiteOrigin: 1, status: 1 });

module.exports = mongoose.model('WebConnectionSession', WebConnectionSessionSchema);
