const express = require('express');
const router = express.Router();

// Controllers
const createConnectionSession = require('../controllers/save/createConnectionSession');
const createMobileConnectionSession = require('../controllers/save/createMobileConnectionSession');
const verifyConnectionCode = require('../controllers/verify/verifyConnectionCode');
const respondToConnectionRequest = require('../controllers/update/respondToConnectionRequest');
const createTransactionRequest = require('../controllers/save/createTransactionRequest');
const getPendingTransactionRequests = require('../controllers/fetch/getPendingTransactionRequests');
const getConnectedSessions = require('../controllers/fetch/getConnectedSessions');
const removeWebConnectionSession = require('../controllers/delete/removeWebConnectionSession');
const updatePushToken = require('../controllers/update/updatePushToken');

// Connection management routes
router.post('/connect/create', createConnectionSession);
router.post('/connect/mobile', createMobileConnectionSession);
router.post('/connect/verify', verifyConnectionCode);
router.post('/connect/respond', respondToConnectionRequest);

// Transaction request routes
router.post('/transaction/create', createTransactionRequest);
router.get('/transaction/pending', getPendingTransactionRequests);

// Session management routes
router.get('/sessions/connected', getConnectedSessions);
router.delete('/sessions/:sessionId', removeWebConnectionSession);

// Push notification routes
router.post('/push/token', updatePushToken);

// Manual cleanup endpoint (for testing/admin)
router.post('/cleanup', async (req, res) => {
    try {
        const { runFullCleanup } = require('../utils/cleanup.utils');
        const results = await runFullCleanup();

        res.json({
            success: true,
            data: {
                message: 'Cleanup completed successfully',
                results,
            },
        });
    } catch (error) {
        console.error('Manual cleanup error:', error);
        res.status(500).json({
            error: 'Cleanup failed',
        });
    }
});

module.exports = router;
