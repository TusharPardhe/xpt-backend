const WebConnectionSession = require('../../models/WebConnectionSession');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

/**
 * Verify the expiring code and return session details
 */
const verifyConnectionCode = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            return response.status(400).json({ error: API_RESPONSE_CODE[400] });
        }

        const { code } = body;

        if (!code) {
            return response.status(400).json({ 
                error: 'Missing required field: code' 
            });
        }

        // Find the session by code
        const session = await WebConnectionSession.findOne({ 
            code: code.toString(),
            status: 'pending'
        });

        if (!session) {
            return response.status(404).json({ 
                error: 'Invalid or expired code' 
            });
        }

        // Check if session has expired
        if (new Date() > session.expiresAt) {
            // Update session status to expired
            session.status = 'expired';
            await session.save();
            
            return response.status(410).json({ 
                error: 'Code has expired' 
            });
        }

        // Update last activity
        session.lastActivity = new Date();
        await session.save();

        response.status(200).json({
            success: true,
            data: {
                sessionId: session.sessionId,
                websiteName: session.websiteName,
                websiteOrigin: session.websiteOrigin,
                websiteIcon: session.websiteIcon,
                permissions: session.metadata.permissions,
                expiresAt: session.expiresAt.toISOString(),
                remainingTime: Math.max(0, Math.floor((session.expiresAt - new Date()) / 1000))
            }
        });

    } catch (error) {
        console.error('Error verifying connection code:', error);
        response.status(500).json({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = verifyConnectionCode;
