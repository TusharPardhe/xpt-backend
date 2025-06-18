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

module.exports = router;
