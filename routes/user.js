const express = require("express");
const router = express.Router();

const verifyJwt = require("../middlewares/verifyJwt");
const decryptJSON = require("../middlewares/decryptRequest");
const fetchXrplAccountDetails = require("../controllers/fetchXrplAccountDetails");
const saveAccountsList = require("../controllers/saveAccountsList");
const deleteSavedAccount = require("../controllers/deleteSavedAccount");
const fetchUserSavedAccounts = require("../controllers/fetchUserSavedAccounts");
const xummQRDonation = require("../controllers/xummQRDonation");

router.post("/save/accounts", decryptJSON, verifyJwt, saveAccountsList);
router.post("/delete/account", decryptJSON, verifyJwt, deleteSavedAccount);
router.post("/account/details", decryptJSON, verifyJwt, fetchXrplAccountDetails);
router.post("/accounts", decryptJSON, verifyJwt, fetchUserSavedAccounts);
router.post("/donate", xummQRDonation);

module.exports = router;