const WebConnectionSession = require('../../models/WebConnectionSession');
const TransactionRequest = require('../../models/TransactionRequest');
const { notifyWebsite } = require('../../websocket/webAuthSocket');

/**
 * Remove/disconnect a web connection session
 */
const removeWebConnectionSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { walletAddress } = req.query;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required',
            });
        }

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Wallet address is required',
            });
        }

        // Find the session
        const session = await WebConnectionSession.findOne({
            sessionId,
            walletAddress,
            status: 'approved', // Use 'approved' status as that's what we're using
        });

        if (!session) {
            // Try to find any session with this sessionId to give better error message
            const anySession = await WebConnectionSession.findOne({ sessionId });
            
            if (!anySession) {
                return res.status(404).json({
                    error: 'Session not found',
                });
            }
            
            if (anySession.walletAddress !== walletAddress) {
                return res.status(403).json({
                    error: 'Session does not belong to this wallet',
                });
            }
            
            if (anySession.status !== 'approved') {
                return res.status(400).json({
                    error: `Session is not active (status: ${anySession.status})`,
                });
            }
            
            return res.status(404).json({
                error: 'Connection not found or already disconnected',
            });
        }

        // Update session status to disconnected
        session.status = 'rejected'; // Use 'rejected' as the final state for disconnected sessions
        session.disconnectedAt = new Date();
        session.metadata.disconnectionReason = 'user_initiated';
        await session.save();

        // Cancel any pending transaction requests for this session
        await TransactionRequest.updateMany(
            {
                sessionId: sessionId,
                status: 'pending',
            },
            {
                status: 'cancelled',
                userResponse: {
                    approved: false,
                    rejectionReason: 'Session disconnected',
                    respondedAt: new Date(),
                },
            }
        );

        // Notify the website about disconnection (if WebSocket is available)
        if (req.io) {
            try {
                await notifyWebsite(req.io, sessionId, 'session:disconnected', {
                    reason: 'user_initiated',
                    disconnectedAt: new Date().toISOString(),
                });
            } catch (socketError) {
                console.warn('Failed to notify website about disconnection:', socketError);
                // Don't fail the request if socket notification fails
            }
        }

        res.json({
            success: true,
            data: {
                message: 'Session disconnected successfully',
                sessionId,
                disconnectedAt: session.disconnectedAt,
            },
        });
    } catch (error) {
        console.error('Error removing web connection session:', error);
        res.status(500).json({
            error: 'Failed to disconnect session',
        });
    }
};

module.exports = removeWebConnectionSession;
