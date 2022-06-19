const express = require("express");
const router = express.Router();
const decryptJSON = require("../middlewares/decryptRequest");
const onBoardUsers = require("../controllers/onBoardUsers");

router.post("/user", decryptJSON, onBoardUsers);

module.exports = router;