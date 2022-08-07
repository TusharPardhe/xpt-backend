const express = require("express");
const router = express.Router();

const decryptJSON = require("../middlewares/decryptRequest");
const verifyJwt = require("../middlewares/verifyJwt");
const fetchAirdropsList = require("../controllers/fetchAirdropsList");
const storeAirdropDetails = require("../controllers/storeAirdropDetails");
const fetchADFormTokenList = require("../controllers/fetchADFormTokenList");

router.get("/list", fetchAirdropsList);
router.post("/add", decryptJSON, verifyJwt, storeAirdropDetails);
router.post("/registration/token/list", decryptJSON, verifyJwt, fetchADFormTokenList);

module.exports = router;
