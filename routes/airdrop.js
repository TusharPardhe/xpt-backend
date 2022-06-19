const express = require("express");
const router = express.Router();

const decryptJSON = require("../middlewares/decryptRequest");
const verifyJwt = require("../middlewares/verifyJwt");
const fetchAirdropsList = require("../controllers/fetchAirdropsList");
const storeAirdropDetails = require("../controllers/storeAirdropDetails");

router.get("/list", fetchAirdropsList);
router.post("/add", decryptJSON, verifyJwt, storeAirdropDetails);

module.exports = router;
