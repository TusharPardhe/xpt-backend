const express = require('express');
const router = express.Router();

const verifyJwt = require('../middlewares/verifyJwt');
const decryptJSON = require('../middlewares/decryptRequest');
const fetchXrplAccountDetails = require('../controllers/fetch/fetchXrplAccountDetails');
const saveAccountsList = require('../controllers/save/saveAccountsList');
const deleteSavedAccount = require('../controllers/delete/deleteSavedAccount');
const fetchUserSavedAccounts = require('../controllers/fetch/fetchUserSavedAccounts');
const fetchAccountTransactions = require('../controllers/fetch/fetchAccountTransactions');
const xummTransaction = require('../controllers/send/xummTransaction');
const verifyUserAddressViaXumm = require('../controllers/verify/verifyUserAddressViaXumm');
const verifyXummUUID = require('../controllers/verify/verifyXummUUID');
const accountEscrows = require('../controllers/save/accountEscrows');
const fetchAllEscrows = require('../controllers/fetch/fetchAllEscrows');
const fetchAccountEscrows = require('../controllers/fetch/fetchAccountEscrows');
const fetchAccountDetails = require('../controllers/fetch/fetchAccountDetails');
const sendEscrowTransactions = require('../controllers/send/sendEscrowTransactions');
const updateEscrow = require('../controllers/update/updateEscrow');

router.post('/save/accounts', decryptJSON, verifyJwt, saveAccountsList);
router.post('transactions', decryptJSON, verifyJwt);
router.post('/delete/account', decryptJSON, verifyJwt, deleteSavedAccount);
// router.post('/account/details', decryptJSON, fetchXrplAccountDetails);
router.post('/accounts', decryptJSON, verifyJwt, fetchUserSavedAccounts);
router.post('/account/transactions', decryptJSON, verifyJwt, fetchAccountTransactions);
router.get('/validate/xrplAccount', verifyUserAddressViaXumm);
router.get('/validate/uuid', verifyXummUUID);
router.post('/xumm/transaction', xummTransaction);

router.post('/account/escrow', fetchAccountEscrows);
router.get('/escrows', fetchAllEscrows);
router.post('/save/account/escrow', accountEscrows);
router.get('/account/details', fetchAccountDetails);
router.get('/send/escrows', sendEscrowTransactions);
router.post('/update/escrow', decryptJSON, updateEscrow);

module.exports = router;
