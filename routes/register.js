const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const decryptJSON = require("../middlewares/decryptRequest");
const onBoardUsers = require("../controllers/onBoardUsers");
const verifyJwt = require("../middlewares/verifyJwt");
const storeAirdropDetails = require("../controllers/storeAirdropDetails");

dotenv.config();

router.post("/user", decryptJSON, onBoardUsers);
router.post("/airdrop", decryptJSON, verifyJwt, storeAirdropDetails);

module.exports = router;


