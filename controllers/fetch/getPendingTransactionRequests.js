const TransactionRequest = require('../../models/TransactionRequest');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

/**
 * Get pending transaction requests for a wallet
 */
const getPendingTransactionRequests = async (request, response) => {
    try {
        const { walletAddress } = request.query;

        if (!walletAddress) {
            return response.status(400).json({ 
                error: 'Wallet address is required' 
            });
        }

        // Find pending transaction requests
        const requests = await TransactionRequest.find({
            walletAddress,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
        .sort({ createdAt: -1 })
        .limit(50);

        // Get session information for each request
        const requestsWithSessions = await Promise.all(
            requests.map(async (req) => {
                const session = await require('../../models/WebConnectionSession').findOne({ sessionId: req.sessionId });
                return {
                    requestId: req.requestId,
                    sessionId: req.sessionId,
                    websiteName: session ? session.websiteName : 'Unknown Website',
                    websiteOrigin: session ? session.websiteOrigin : 'Unknown Origin',
                    websiteIcon: session ? session.websiteIcon : null,
                    transactionType: req.transactionType,
                    transactionData: req.transactionData,
                    expiresAt: req.expiresAt.toISOString(),
                    remainingTime: Math.max(0, Math.floor((req.expiresAt - new Date()) / 1000)),
                    createdAt: req.createdAt.toISOString()
                };
            })
        );

        response.status(200).json({
            success: true,
            data: {
                requests: requestsWithSessions,
                count: requestsWithSessions.length
            }
        });

    } catch (error) {
        console.error('Error fetching pending transaction requests:', error);
        response.status(500).json({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = getPendingTransactionRequests;
