const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const UsersDB = require("../models/UsersDB");
const jwt = require("jsonwebtoken");

dotenv.config();

router.post("/", async (request, response) => {

    try {
        const { body } = request;

        if (!body) {
            response.status(400).send(`Bad request. Missing request body.`);
            return;
        }
    
        const { userName, address, password } = body;
    
        // Validate request
        if (!(userName && address && password)) {
            res.status(400).send("Bad request. Please check request");
        }

        const doesUserExists = await UsersDB.findOne({ email: userName });

        if (doesUserExists) {
            response.status(409).send("Username already exists.");
            return;
        };

        const User = new UsersDB(body);
        await User.save();
        response.status(200).send("Data saved successfully");

    } catch(err) {
        response.status(400).send(err);
    };
});

module.exports = router;