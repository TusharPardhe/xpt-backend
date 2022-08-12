const express = require("express");
const router = express.Router();

const decryptJSON = require("../middlewares/decryptRequest");
const verifyJwt = require("../middlewares/verifyJwt");
const fetchAirdropsList = require("../controllers/fetch/fetchAirdropsList");
const storeAirdropDetails = require("../controllers/save/storeAirdropDetails");
const fetchADFormTokenList = require("../controllers/fetch/fetchADFormTokenList");

router.get("/list", fetchAirdropsList);
router.post("/add", decryptJSON, verifyJwt, storeAirdropDetails);
router.post("/registration/token/list", decryptJSON, verifyJwt, fetchADFormTokenList);

module.exports = router;
