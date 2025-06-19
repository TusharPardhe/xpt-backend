const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a 6-digit expiring code
 */
const generateExpiringCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a unique request ID
 */
const generateRequestId = () => {
    return `txn_${uuidv4().replace(/-/g, '')}`;
};

/**
 * Generate a secure random string
 */
const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Create expiration time (2 minutes from now)
 */
const createExpirationTime = (minutes = 2) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Create transaction expiration time (5 minutes from now)
 */
const createTransactionExpirationTime = (minutes = 5) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Validate XRPL address
 */
const isValidXRPLAddress = (address) => {
    if (!address || typeof address !== 'string') return false;

    // Classic address validation (starts with 'r')
    if (address.startsWith('r')) {
        return address.length >= 25 && address.length <= 34;
    }

    // X-address validation (starts with 'X')
    if (address.startsWith('X')) {
        return address.length >= 47 && address.length <= 47;
    }

    return false;
};

/**
 * Validate destination tag
 */
const isValidDestinationTag = (tag) => {
    if (tag === null || tag === undefined) return true;
    const num = parseInt(tag);
    return !isNaN(num) && num >= 0 && num <= 4294967295;
};

/**
 * Validate XRP amount
 */
const isValidXRPAmount = (amount) => {
    if (!amount) return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 100000000; // Max XRP supply
};

/**
 * Sanitize website origin
 */
const sanitizeOrigin = (origin) => {
    if (!origin) return null;
    try {
        const url = new URL(origin);
        return `${url.protocol}//${url.host}`;
    } catch (error) {
        return null;
    }
};

/**
 * Generate push notification payload
 */
const createPushNotificationPayload = (type, data) => {
    const basePayload = {
        notification: {
            title: 'RevoX Wallet',
            badge: 1,
            sound: 'default',
        },
        data: {
            type,
            timestamp: Date.now().toString(),
            ...data,
        },
    };

    switch (type) {
        case 'connection_request':
            basePayload.notification.title = 'Website Connection Request';
            basePayload.notification.body = `${data.websiteName} wants to connect to your wallet`;
            break;
        case 'transaction_request':
            basePayload.notification.title = 'Transaction Request';
            basePayload.notification.body = `${data.websiteName} wants to send a transaction`;
            break;
        case 'connection_approved':
            basePayload.notification.title = 'Connection Established';
            basePayload.notification.body = `Successfully connected to ${data.websiteName}`;
            break;
        default:
            basePayload.notification.body = 'New wallet notification';
    }

    return basePayload;
};

/**
 * Format transaction for display
 */
const formatTransactionForDisplay = (transactionData) => {
    const formatted = {
        type: transactionData.transactionType,
        summary: '',
        details: {},
    };

    switch (transactionData.transactionType) {
        case 'payment':
            if (typeof transactionData.transactionData.amount === 'string') {
                // XRP payment
                const xrpAmount = (parseFloat(transactionData.transactionData.amount) / 1000000).toFixed(6);
                formatted.summary = `Send ${xrpAmount} XRP to ${transactionData.transactionData.destination}`;
                formatted.details = {
                    amount: `${xrpAmount} XRP`,
                    destination: transactionData.transactionData.destination,
                    destinationTag: transactionData.transactionData.destinationTag,
                    memo: transactionData.transactionData.memo,
                };
            } else {
                // Token payment
                const token = transactionData.transactionData.amount;
                formatted.summary = `Send ${token.value} ${token.currency} to ${transactionData.transactionData.destination}`;
                formatted.details = {
                    amount: `${token.value} ${token.currency}`,
                    destination: transactionData.transactionData.destination,
                    issuer: token.issuer,
                    destinationTag: transactionData.transactionData.destinationTag,
                    memo: transactionData.transactionData.memo,
                };
            }
            break;
        case 'trust_set':
            formatted.summary = `Set trust line for ${transactionData.transactionData.currency}`;
            formatted.details = {
                currency: transactionData.transactionData.currency,
                issuer: transactionData.transactionData.issuer,
                limit: transactionData.transactionData.limit,
            };
            break;
        default:
            formatted.summary = `${transactionData.transactionType} transaction`;
            formatted.details = transactionData.transactionData;
    }

    return formatted;
};

module.exports = {
    generateExpiringCode,
    generateSessionId,
    generateRequestId,
    generateSecureToken,
    createExpirationTime,
    createTransactionExpirationTime,
    isValidXRPLAddress,
    isValidDestinationTag,
    isValidXRPAmount,
    sanitizeOrigin,
    createPushNotificationPayload,
    formatTransactionForDisplay,
};
