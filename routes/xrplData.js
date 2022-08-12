const express = require("express");
const router = express.Router();
const fetchXrplFungibleTokenList = require("../controllers/fetch/fetchXrplFungibleTokenList");

router.get("/fungibleTokens/list", fetchXrplFungibleTokenList);

module.exports = router;