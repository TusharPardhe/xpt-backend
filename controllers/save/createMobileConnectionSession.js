const WebConnectionSession = require('../../models/WebConnectionSession');
const { generateExpiringCode, generateSessionId, createExpirationTime } = require('../../utils/webAuth.utils');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

/**
 * Create a new connection session from mobile app
 * This generates a code that websites can use to connect
 */
const createMobileConnectionSession = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            return response.status(400).json({ error: API_RESPONSE_CODE[400] });
        }

        const { walletAddress, deviceId } = body;

        // Validate required fields
        if (!walletAddress || !deviceId) {
            return response.status(400).json({
                error: 'Missing required fields: walletAddress and deviceId',
            });
        }

        // Generate session data
        const sessionId = generateSessionId();
        const code = generateExpiringCode();
        const expiresAt = createExpirationTime(2); // 2 minutes

        // Create session record
        const session = new WebConnectionSession({
            sessionId,
            code,
            walletAddress,
            deviceId,
            websiteOrigin: 'mobile_generated',
            websiteName: 'Mobile Generated Code',
            expiresAt,
            status: 'pending',
            metadata: {
                userAgent: request.headers['user-agent'],
                ipAddress: request.ip || request.connection.remoteAddress,
                permissions: ['read_balance', 'read_account_info', 'sign_transactions'],
            },
        });

        await session.save();

        response.status(200).json({
            success: true,
            data: {
                sessionId,
                code,
                expiresAt: expiresAt.toISOString(),
                expiresIn: 120, // seconds
            },
        });
    } catch (error) {
        console.error('Error creating mobile connection session:', error);
        response.status(500).json({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = createMobileConnectionSession;
