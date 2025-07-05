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

        // Find all approved sessions for this wallet
        // Include both persistent connections and active timed connections
        const connectedSessions = await WebConnectionSession.find({
            walletAddress,
            status: 'approved',
            // Exclude sessions that have been explicitly disconnected
            disconnectedAt: { $exists: false },
            // Include persistent connections OR active timed connections
            $or: [
                { connectionExpiresAt: { $exists: false } }, // Persistent connections (field not set)
                { connectionExpiresAt: null }, // Persistent connections (field explicitly null)
                { connectionExpiresAt: { $gt: new Date() } } // Active timed connections
            ]
        }).sort({ connectedAt: -1 }); // Most recent first

        console.log(`Found ${connectedSessions.length} connected sessions for wallet ${walletAddress}`);
        if (connectedSessions.length > 0) {
            const persistentCount = connectedSessions.filter(s => !s.connectionExpiresAt).length;
            const timedCount = connectedSessions.length - persistentCount;
            console.log(`  - ${persistentCount} persistent, ${timedCount} timed connections`);
        }

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
