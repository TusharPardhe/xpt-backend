const express = require("express");
const router = express.Router();

const decryptJSON = require("../middlewares/decryptRequest");
const verifyUserLogin = require("../controllers/verifyUserLogin");

router.post("/", decryptJSON, verifyUserLogin);

module.exports = router;


