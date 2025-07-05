const WebConnectionSession = require('../../models/WebConnectionSession');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

/**
 * Check if a website has an existing approved connection with a user
 * This allows websites to detect if they should request a new connection or use existing one
 */
const checkExistingConnection = async (request, response) => {
    try {
        const { walletAddress, websiteOrigin } = request.query;

        if (!walletAddress || !websiteOrigin) {
            return response.status(400).json({
                error: 'Missing required parameters: walletAddress and websiteOrigin',
            });
        }

        // Look for existing approved connection between this wallet and website
        const existingConnection = await WebConnectionSession.findOne({
            walletAddress,
            websiteOrigin,
            status: 'approved',
            // Only check for unexpired connections if connectionExpiresAt is set
            $or: [
                { connectionExpiresAt: null }, // Persistent connections
                { connectionExpiresAt: { $gt: new Date() } } // Active timed connections
            ]
        }).sort({ approvedAt: -1 }); // Get most recent connection

        if (existingConnection) {
            // Update last activity
            existingConnection.lastActivity = new Date();
            await existingConnection.save();

            return response.status(200).json({
                success: true,
                data: {
                    hasConnection: true,
                    sessionId: existingConnection.sessionId,
                    websiteName: existingConnection.websiteName,
                    websiteOrigin: existingConnection.websiteOrigin,
                    permissions: existingConnection.metadata.permissions,
                    connectedAt: existingConnection.connectedAt?.toISOString() || existingConnection.approvedAt.toISOString(),
                    lastActivity: existingConnection.lastActivity.toISOString(),
                    isPersistent: !existingConnection.connectionExpiresAt,
                    expiresAt: existingConnection.connectionExpiresAt?.toISOString() || null,
                },
            });
        } else {
            return response.status(200).json({
                success: true,
                data: {
                    hasConnection: false,
                    message: 'No existing connection found. A new connection request should be initiated.',
                },
            });
        }
    } catch (error) {
        console.error('Error checking existing connection:', error);
        response.status(500).json({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = checkExistingConnection;
