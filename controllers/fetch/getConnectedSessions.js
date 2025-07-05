const WebConnectionSession = require('../../models/WebConnectionSession');

/**
 * Get connected sessions for a wallet
 */
const getConnectedSessions = async (req, res) => {
    try {
        const { walletAddress } = req.query;

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Wallet address is required',
            });
        }

        // Find all approved sessions for this wallet (no expiration filter for approved connections)
        const connectedSessions = await WebConnectionSession.find({
            walletAddress,
            status: 'approved',
            // Only filter by connection expiration if it's set (for backwards compatibility)
            $or: [
                { connectionExpiresAt: null }, // Persistent connections
                { connectionExpiresAt: { $gt: new Date() } } // Active timed connections
            ]
        }).sort({ connectedAt: -1 }); // Most recent first

        const sessions = connectedSessions.map((session) => ({
            sessionId: session.sessionId,
            websiteName: session.websiteName,
            websiteOrigin: session.websiteOrigin,
            websiteIcon: session.websiteIcon,
            permissions: session.metadata.permissions,
            connectedAt: session.connectedAt?.toISOString() || session.createdAt.toISOString(),
            lastActivity: session.lastActivity?.toISOString() || session.connectedAt?.toISOString(),
            isPersistent: !session.connectionExpiresAt,
            connectionExpiresAt: session.connectionExpiresAt?.toISOString() || null,
            remainingTime: session.connectionExpiresAt ? 
                Math.max(0, Math.floor((session.connectionExpiresAt - new Date()) / 1000)) : 
                null, // null means persistent
        }));

        res.json({
            success: true,
            data: {
                sessions,
                count: sessions.length,
            },
        });
    } catch (error) {
        console.error('Error fetching connected sessions:', error);
        res.status(500).json({
            error: 'Internal server error',
        });
    }
};

module.exports = getConnectedSessions;
