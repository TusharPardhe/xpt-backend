const express = require("express");
const router = express.Router();

const verifyJwt = require("../middlewares/verifyJwt");
const decryptJSON = require("../middlewares/decryptRequest");
const fetchXrplAccountDetails = require("../controllers/fetch/fetchXrplAccountDetails");
const saveAccountsList = require("../controllers/save/saveAccountsList");
const deleteSavedAccount = require("../controllers/delete/deleteSavedAccount");
const fetchUserSavedAccounts = require("../controllers/fetch/fetchUserSavedAccounts");
const fetchAccountTransactions = require("../controllers/fetch/fetchAccountTransactions");
const xummTransaction = require("../controllers/verify/xummTransaction");
const verifyUserAddressViaXumm = require("../controllers/verify/verifyUserAddressViaXumm");
const verifyXummUUID = require("../controllers/verify/verifyXummUUID");

router.post("/save/accounts", decryptJSON, verifyJwt, saveAccountsList);
router.post("transactions", decryptJSON, verifyJwt);
router.post("/delete/account", decryptJSON, verifyJwt, deleteSavedAccount);
router.post("/account/details", decryptJSON, verifyJwt, fetchXrplAccountDetails);
router.post("/accounts", decryptJSON, verifyJwt, fetchUserSavedAccounts);
router.post("/account/transactions", decryptJSON, verifyJwt, fetchAccountTransactions);
router.get("/validate/xrplAccount", verifyUserAddressViaXumm);
router.get("/validate/uuid", verifyXummUUID);
router.post("/xumm/transaction", xummTransaction);

module.exports = router;