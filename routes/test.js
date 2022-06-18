const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");

// const UserSchema = require("../models/UserSchema");
const verifyJwt = require("../middlewares/verifyJwt");

dotenv.config();

router.post("/", verifyJwt, (request, response) => {
    response.send(request.body);
})

module.exports = router;