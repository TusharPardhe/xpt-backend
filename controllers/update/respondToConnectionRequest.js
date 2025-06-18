const WebConnectionSession = require('../../models/WebConnectionSession');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const { isValidXRPLAddress } = require('../../utils/webAuth.utils');

/**
 * Approve or reject a connection request
 */
const respondToConnectionRequest = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            return response.status(400).json({ error: API_RESPONSE_CODE[400] });
        }

        const { sessionId, approved, walletAddress, deviceId, rejectionReason } = body;

        if (!sessionId || typeof approved !== 'boolean') {
            return response.status(400).json({ 
                error: 'Missing required fields: sessionId and approved' 
            });
        }

        // Find the session
        const session = await WebConnectionSession.findOne({ 
            sessionId,
            status: 'pending'
        });

        if (!session) {
            return response.status(404).json({ 
                error: 'Session not found or already processed' 
            });
        }

        // Check if session has expired
        if (new Date() > session.expiresAt) {
            session.status = 'expired';
            await session.save();
            
            return response.status(410).json({ 
                error: 'Session has expired' 
            });
        }

        if (approved) {
            // Validate wallet address if approved
            if (!walletAddress || !isValidXRPLAddress(walletAddress)) {
                return response.status(400).json({ 
                    error: 'Valid wallet address is required for approval' 
                });
            }

            if (!deviceId) {
                return response.status(400).json({ 
                    error: 'Device ID is required for approval' 
                });
            }

            // Update session with approval
            session.status = 'approved';
            session.walletAddress = walletAddress;
            session.deviceId = deviceId;
            session.approvedAt = new Date();
        } else {
            // Update session with rejection
            session.status = 'rejected';
            session.metadata.rejectionReason = rejectionReason || 'User declined';
        }

        session.lastActivity = new Date();
        await session.save();

        response.status(200).json({
            success: true,
            data: {
                sessionId: session.sessionId,
                status: session.status,
                walletAddress: session.walletAddress,
                approvedAt: session.approvedAt
            }
        });

    } catch (error) {
        console.error('Error responding to connection request:', error);
        response.status(500).json({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = respondToConnectionRequest;
