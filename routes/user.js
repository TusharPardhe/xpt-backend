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
const sendJwt = require('../controllers/send/sendJwt');
const fetchAccountNfts = require('../controllers/fetch/fetchAccountNfts');
const saveNewRecord = require('../controllers/save/saveNewRecord');
const fetchAccountRecords = require('../controllers/fetch/fetchAccountRecords');
const fetchAllRecords = require('../controllers/fetch/fetchAllRecords');
const fetchPatientEncryptedData = require('../controllers/fetch/fetchPatientEncryptedData');

router.post('/save/accounts', decryptJSON, verifyJwt, saveAccountsList);
router.post('transactions', decryptJSON, verifyJwt);
router.post('/delete/account', decryptJSON, verifyJwt, deleteSavedAccount);
// router.post('/account/details', decryptJSON, fetchXrplAccountDetails);
router.post('/accounts', decryptJSON, verifyJwt, fetchUserSavedAccounts);
router.post('/account/transactions', decryptJSON, verifyJwt, fetchAccountTransactions);
router.get('/validate/xrplAccount', verifyUserAddressViaXumm);
router.get('/validate/uuid', verifyXummUUID);
router.post('/xumm/transaction', xummTransaction);
router.post('/signIn', sendJwt);

router.post('/account/escrow', fetchAccountEscrows);
router.post('/account/nfts', fetchAccountNfts);
router.post('/account/save/record', saveNewRecord);
router.get('/account/records', fetchAccountRecords);

router.get('/records', fetchAllRecords);
router.get('/escrows', fetchAllEscrows);
router.get('/patient/data', fetchPatientEncryptedData);
router.post('/save/account/escrow', accountEscrows);
router.get('/account/details', fetchAccountDetails);
router.get('/send/escrows', sendEscrowTransactions);
router.post('/update/escrow', decryptJSON, updateEscrow);

module.exports = router;
