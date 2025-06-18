const WebConnectionSession = require('../models/WebConnectionSession');
const TransactionRequest = require('../models/TransactionRequest');

/**
 * Setup WebSocket handlers for web authentication
 */
const setupWebAuthSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`WebAuth client connected: ${socket.id} at ${new Date().toISOString()}`);

        // Handle website connection requests
        socket.on('website:connect', async (data) => {
            try {
                const { sessionId } = data;

                if (!sessionId) {
                    socket.emit('error', { message: 'Session ID is required' });
                    return;
                }

                // Join session room for real-time updates
                socket.join(`session_${sessionId}`);

                // Get session status
                const session = await WebConnectionSession.findOne({ sessionId });
                if (session) {
                    socket.emit('session:status', {
                        sessionId,
                        status: session.status,
                        expiresAt: session.expiresAt.toISOString(),
                    });
                }
            } catch (error) {
                console.error('Error handling website connect:', error);
                socket.emit('error', { message: 'Failed to connect to session' });
            }
        });

        // Handle mobile app connection requests
        socket.on('mobile:connect', async (data) => {
            try {
                const { walletAddress, deviceId } = data;

                if (!walletAddress || !deviceId) {
                    socket.emit('error', { message: 'Wallet address and device ID are required' });
                    return;
                }

                // Join wallet room for notifications
                socket.join(`wallet_${walletAddress}`);

                // Send pending requests
                const pendingRequests = await TransactionRequest.find({
                    walletAddress,
                    status: 'pending',
                    expiresAt: { $gt: new Date() },
                }).populate('sessionId');

                if (pendingRequests.length > 0) {
                    socket.emit('pending:requests', {
                        count: pendingRequests.length,
                        requests: pendingRequests.map((req) => ({
                            requestId: req.requestId,
                            websiteName: req.sessionId.websiteName,
                            transactionType: req.transactionType,
                            expiresAt: req.expiresAt.toISOString(),
                        })),
                    });
                }
            } catch (error) {
                console.error('Error handling mobile connect:', error);
                socket.emit('error', { message: 'Failed to connect mobile client' });
            }
        });

        // Handle connection approval/rejection
        socket.on('connection:respond', async (data) => {
            try {
                const { sessionId, approved, walletAddress } = data;

                const session = await WebConnectionSession.findOne({ sessionId });
                if (!session) {
                    socket.emit('error', { message: 'Session not found' });
                    return;
                }

                // Notify website about the response
                io.to(`session_${sessionId}`).emit('connection:response', {
                    sessionId,
                    approved,
                    walletAddress: approved ? walletAddress : undefined,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error('Error handling connection response:', error);
                socket.emit('error', { message: 'Failed to process connection response' });
            }
        });

        // Handle transaction responses
        socket.on('transaction:respond', async (data) => {
            try {
                const { requestId, approved, transactionHash, error } = data;

                const request = await TransactionRequest.findOne({ requestId });

                if (!request) {
                    socket.emit('error', { message: 'Transaction request not found' });
                    return;
                }

                // Get the session manually since sessionId is a string, not ObjectId
                const session = await WebConnectionSession.findOne({ sessionId: request.sessionId });

                if (!session) {
                    socket.emit('error', { message: 'Associated session not found' });
                    return;
                }

                // Update request status
                if (approved && transactionHash) {
                    request.status = 'submitted';
                    request.submissionResult = {
                        transactionHash,
                        submittedAt: new Date(),
                    };
                } else {
                    request.status = 'rejected';
                    request.userResponse = {
                        approved: false,
                        rejectionReason: error || 'User declined',
                        respondedAt: new Date(),
                    };
                }

                await request.save();

                // Notify website about transaction response using the correct session ID
                io.to(`session_${request.sessionId}`).emit('transaction:response', {
                    requestId,
                    approved,
                    transactionHash: approved ? transactionHash : undefined,
                    error: approved ? undefined : error || 'User declined',
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error('Error handling transaction response:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    data: data
                });
                socket.emit('error', { 
                    message: 'Failed to process transaction response',
                    details: error.message 
                });
            }
        });

        // Handle session status requests
        socket.on('session:status', async (data) => {
            try {
                const { sessionId } = data;

                const session = await WebConnectionSession.findOne({ sessionId });
                if (session) {
                    socket.emit('session:status', {
                        sessionId,
                        status: session.status,
                        walletAddress: session.walletAddress,
                        expiresAt: session.expiresAt.toISOString(),
                        remainingTime: Math.max(0, Math.floor((session.expiresAt - new Date()) / 1000)),
                    });
                } else {
                    socket.emit('error', { message: 'Session not found' });
                }
            } catch (error) {
                console.error('Error getting session status:', error);
                socket.emit('error', { message: 'Failed to get session status' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`WebAuth client disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Send push notification to mobile app
 */
const sendPushNotification = async (io, walletAddress, type, data) => {
    try {
        // Send notification to wallet room
        io.to(`wallet_${walletAddress}`).emit('push:notification', {
            type,
            data,
            timestamp: new Date().toISOString(),
        });

        // Here you would also integrate with actual push notification services
        // like Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNs)
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

/**
 * Notify website about session updates
 */
const notifyWebsite = async (io, sessionId, eventType, data) => {
    try {
        io.to(`session_${sessionId}`).emit(eventType, {
            sessionId,
            ...data,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error notifying website:', error);
    }
};

module.exports = {
    setupWebAuthSocket,
    sendPushNotification,
    notifyWebsite,
};
