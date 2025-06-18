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

        // Find all connected sessions for this wallet
        const connectedSessions = await WebConnectionSession.find({
            walletAddress,
            status: 'approved',
            expiresAt: { $gt: new Date() }, // Only active sessions
        }).sort({ connectedAt: -1 }); // Most recent first

        const sessions = connectedSessions.map((session) => ({
            sessionId: session.sessionId,
            websiteName: session.websiteName,
            websiteOrigin: session.websiteOrigin,
            websiteIcon: session.websiteIcon,
            permissions: session.permissions,
            connectedAt: session.connectedAt?.toISOString() || session.createdAt.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            remainingTime: Math.max(0, Math.floor((session.expiresAt - new Date()) / 1000)),
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
