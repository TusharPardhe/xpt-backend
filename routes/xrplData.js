const express = require("express");
const router = express.Router();
const fetchXrplFungibleTokenList = require("../controllers/fetchXrplFungibleTokenList");

router.get("/fungibleTokens/list", fetchXrplFungibleTokenList);

module.exports = router;