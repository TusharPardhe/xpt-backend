const mongoose = require('mongoose');

const TransactionRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    walletAddress: {
        type: String,
        required: true,
        index: true
    },
    websiteOrigin: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['payment', 'trust_set', 'offer_create', 'offer_cancel', 'escrow_create', 'escrow_finish', 'check_create', 'check_cash', 'account_set'],
        required: true
    },
    transactionData: {
        // Payment specific fields
        destination: String,
        amount: mongoose.Schema.Types.Mixed, // Can be XRP amount or token object
        destinationTag: Number,
        memo: String,
        
        // Trust line specific fields
        currency: String,
        issuer: String,
        limit: String,
        
        // Offer specific fields
        takerGets: mongoose.Schema.Types.Mixed,
        takerPays: mongoose.Schema.Types.Mixed,
        offerSequence: Number,
        
        // Account set specific fields
        flags: Number,
        domain: String,
        emailHash: String,
        messageKey: String,
        transferRate: Number,
        tickSize: Number,
        
        // Generic fields
        fee: String,
        sequence: Number,
        lastLedgerSequence: Number
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'submitted', 'confirmed', 'failed', 'expired'],
        default: 'pending',
        index: true
    },
    userResponse: {
        approved: Boolean,
        rejectionReason: String,
        respondedAt: Date
    },
    submissionResult: {
        transactionHash: String,
        submittedAt: Date,
        confirmedAt: Date,
        ledgerIndex: Number,
        error: String
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    metadata: {
        estimatedFee: String,
        networkFee: String,
        gasLimit: Number,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    }
}, {
    timestamps: true
});

// TTL index for automatic cleanup
TransactionRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for efficient queries
TransactionRequestSchema.index({ sessionId: 1, status: 1 });
TransactionRequestSchema.index({ walletAddress: 1, status: 1 });
TransactionRequestSchema.index({ requestId: 1, status: 1 });

module.exports = mongoose.model('TransactionRequest', TransactionRequestSchema);
