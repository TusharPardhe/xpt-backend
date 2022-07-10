const express = require("express");
const router = express.Router();

const verifyJwt = require("../middlewares/verifyJwt");
const decryptJSON = require("../middlewares/decryptRequest");
const saveAccountsList = require("../controllers/saveAccountsList");
const deleteSavedAccount = require("../controllers/deleteSavedAccount");
const fetchUserSavedAccounts = require("../controllers/fetchUserSavedAccounts");

router.post("/save/accounts", decryptJSON, verifyJwt, saveAccountsList);
router.post("/delete/account", decryptJSON, verifyJwt, deleteSavedAccount);
router.post("/accounts", decryptJSON, verifyJwt, fetchUserSavedAccounts);

module.exports = router;