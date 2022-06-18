const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const UserSchema = require("../models/UserSchema");
const jwt = require("jsonwebtoken");

dotenv.config();

router.post("/", async (request, response) => {

    try {
        const { body } = request;

        if (!body) {
            response.status(400).send({ error: `Bad request. Missing request body.` });
            return;
        }

        const { userName, address, password } = body;

        // Validate request
        if (!(userName && address && password)) {
            response.status(400).send({ error: "Bad request. Please check request" });
            return;
        }

        const doestUsernameExist = await UserSchema.findOne({ userName });
        const doestAddressExist = await UserSchema.findOne({ address });

        if (doestUsernameExist || doestAddressExist) {
            response.status(409).send({ error: `Username or XRPL address already exists.` });
            return;
        }

        const User = new UserSchema(body);
        await User.save();
        response.status(200).send({ success: "Data saved successfully" });
    } catch(err) {
        response.status(400).send(err);
    };
});

module.exports = router;