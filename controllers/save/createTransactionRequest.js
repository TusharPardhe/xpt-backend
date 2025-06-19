const TransactionRequest = require('../../models/TransactionRequest');
const WebConnectionSession = require('../../models/WebConnectionSession');
const {
    generateRequestId,
    createTransactionExpirationTime,
    isValidXRPLAddress,
    isValidDestinationTag,
    isValidXRPAmount,
} = require('../../utils/webAuth.utils');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const { sendPushNotificationToUser } = require('../../utils/pushNotification.utils');

/**
 * Create a new transaction request from a connected website
 */
const createTransactionRequest = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            return response.status(400).json({ error: API_RESPONSE_CODE[400] });
        }

        const {
            sessionId,
            transactionType,
            transactionData,
            expirationMinutes = 2, // Default to 2 minutes for security
        } = body;

        // Validate required fields
        if (!sessionId || !transactionType || !transactionData) {
            return response.status(400).json({
                error: 'Missing required fields: sessionId, transactionType, transactionData',
            });
        }

        // Find and validate session
        const session = await WebConnectionSession.findOne({
            sessionId,
            status: 'approved',
        });

        if (!session) {
            return response.status(404).json({
                error: 'Session not found or not approved',
            });
        }

        // Check if session has sign_transactions permission
        if (!session.metadata.permissions.includes('sign_transactions')) {
            return response.status(403).json({
                error: 'Session does not have transaction signing permission',
            });
        }

        // Validate transaction data based on type
        const validationResult = validateTransactionData(transactionType, transactionData);
        if (!validationResult.valid) {
            return response.status(400).json({
                error: validationResult.error,
            });
        }

        // Generate request data
        const requestId = generateRequestId();
        const expiresAt = createTransactionExpirationTime(expirationMinutes);

        // Create transaction request
        const transactionRequest = new TransactionRequest({
            requestId,
            sessionId,
            walletAddress: session.walletAddress,
            websiteOrigin: session.websiteOrigin,
            transactionType,
            transactionData: validationResult.normalizedData,
            expiresAt,
            status: 'pending',
        });

        await transactionRequest.save();

        // Send push notification to user
        try {
            await sendPushNotificationToUser(session.walletAddress, {
                title: 'Transaction Request',
                body: `${session.websiteName} wants to send a transaction`,
                data: {
                    type: 'transaction_request',
                    requestId,
                    sessionId,
                    websiteName: session.websiteName,
                    transactionType,
                },
            });
        } catch (notificationError) {
            console.error('Failed to send push notification:', notificationError);
            // Don't fail the request if notification fails
        }

        response.status(200).json({
            success: true,
            data: {
                requestId,
                transactionType,
                expiresAt: expiresAt.toISOString(),
                expiresIn: expirationMinutes * 60,
                estimatedFee: validationResult.estimatedFee,
            },
        });
    } catch (error) {
        console.error('Error creating transaction request:', error);
        response.status(500).json({ error: API_RESPONSE_CODE[500] });
    }
};

/**
 * Validate transaction data based on transaction type
 */
const validateTransactionData = (transactionType, data) => {
    const result = {
        valid: false,
        error: null,
        normalizedData: null,
        estimatedFee: '0.000012', // Default XRPL fee
    };

    try {
        switch (transactionType) {
            case 'payment':
                result.valid = validatePaymentData(data);
                if (!result.valid) {
                    result.error = 'Invalid payment data';
                    return result;
                }

                // Normalize amount
                if (typeof data.amount === 'string') {
                    // XRP amount - convert to drops if needed
                    const xrpAmount = parseFloat(data.amount);
                    data.amount = (xrpAmount * 1000000).toString();
                }

                result.normalizedData = data;
                break;

            case 'trust_set':
                result.valid = validateTrustSetData(data);
                if (!result.valid) {
                    result.error = 'Invalid trust set data';
                    return result;
                }
                result.normalizedData = data;
                break;

            case 'offer_create':
                result.valid = validateOfferCreateData(data);
                if (!result.valid) {
                    result.error = 'Invalid offer create data';
                    return result;
                }
                result.normalizedData = data;
                break;

            default:
                result.error = `Unsupported transaction type: ${transactionType}`;
                return result;
        }

        result.valid = true;
        return result;
    } catch (error) {
        result.error = `Validation error: ${error.message}`;
        return result;
    }
};

/**
 * Validate payment transaction data
 */
const validatePaymentData = (data) => {
    if (!data.destination || !isValidXRPLAddress(data.destination)) {
        return false;
    }

    if (!data.amount) {
        return false;
    }

    // Validate XRP amount
    if (typeof data.amount === 'string') {
        if (!isValidXRPAmount(data.amount)) {
            return false;
        }
    } else if (typeof data.amount === 'object') {
        // Token amount validation
        if (!data.amount.value || !data.amount.currency || !data.amount.issuer) {
            return false;
        }
        if (!isValidXRPLAddress(data.amount.issuer)) {
            return false;
        }
    } else {
        return false;
    }

    // Validate destination tag if provided
    if (data.destinationTag !== undefined && !isValidDestinationTag(data.destinationTag)) {
        return false;
    }

    return true;
};

/**
 * Validate trust set transaction data
 */
const validateTrustSetData = (data) => {
    if (!data.currency || !data.issuer) {
        return false;
    }

    if (!isValidXRPLAddress(data.issuer)) {
        return false;
    }

    if (data.limit && (isNaN(parseFloat(data.limit)) || parseFloat(data.limit) < 0)) {
        return false;
    }

    return true;
};

/**
 * Validate offer create transaction data
 */
const validateOfferCreateData = (data) => {
    if (!data.takerGets || !data.takerPays) {
        return false;
    }

    // Validate both sides of the offer
    return validateAmount(data.takerGets) && validateAmount(data.takerPays);
};

/**
 * Validate amount (XRP or token)
 */
const validateAmount = (amount) => {
    if (typeof amount === 'string') {
        return isValidXRPAmount(amount);
    } else if (typeof amount === 'object') {
        return amount.value && amount.currency && amount.issuer && isValidXRPLAddress(amount.issuer);
    }
    return false;
};

module.exports = createTransactionRequest;
