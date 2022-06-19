const express = require("express");
const router = express.Router();

const decryptJSON = require("../middlewares/decryptRequest");
const verifyUserLogin = require("../controllers/verifyUserLogin");

router.post("/user", decryptJSON, verifyUserLogin);

module.exports = router;