const WebConnectionSession = require('../../models/WebConnectionSession');
const { generateExpiringCode, generateSessionId, createExpirationTime, sanitizeOrigin } = require('../../utils/webAuth.utils');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

/**
 * Create a new connection session with expiring code
 */
const createConnectionSession = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            return response.status(400).json({ error: API_RESPONSE_CODE[400] });
        }

        const { websiteName, websiteOrigin, websiteIcon, permissions = ['read_balance', 'read_account_info'] } = body;

        // Validate required fields
        if (!websiteName || !websiteOrigin) {
            return response.status(400).json({
                error: 'Missing required fields: websiteName and websiteOrigin',
            });
        }

        // Sanitize and validate origin
        const sanitizedOrigin = sanitizeOrigin(websiteOrigin);
        if (!sanitizedOrigin) {
            return response.status(400).json({
                error: 'Invalid websiteOrigin format',
            });
        }

        // Validate permissions
        const validPermissions = ['read_balance', 'read_transactions', 'sign_transactions', 'read_account_info'];
        const filteredPermissions = permissions.filter((perm) => validPermissions.includes(perm));

        // Generate session data
        const sessionId = generateSessionId();
        const code = generateExpiringCode();
        const expiresAt = createExpirationTime(2); // 2 minutes

        // Create session record
        const session = new WebConnectionSession({
            sessionId,
            code,
            websiteOrigin: sanitizedOrigin,
            websiteName: websiteName.trim(),
            websiteIcon: websiteIcon || null,
            expiresAt,
            status: 'pending',
            metadata: {
                userAgent: request.headers['user-agent'],
                ipAddress: request.ip || request.connection.remoteAddress,
                permissions: filteredPermissions,
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
        console.error('Error creating connection session:', error);
        response.status(500).json({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = createConnectionSession;
