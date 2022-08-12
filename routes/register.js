const express = require("express");
const router = express.Router();
const decryptJSON = require("../middlewares/decryptRequest");
const onBoardUsers = require("../controllers/save/onBoardUsers");

router.post("/user", decryptJSON, onBoardUsers);

module.exports = router;