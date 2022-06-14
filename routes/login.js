const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UsersDB = require("../models/UsersDB");

dotenv.config();

router.get("/", (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send(`Bad request. Missing request body.`);
            return;
        }

        const { userName, password } = body;

        if (!(userName && password)) {
            res.status(400).send("Bad request. Please check request");
        };

        const savedUserData = await UsersDB.findOne({ userName });

        if (!savedUserData) {
            response.status(409).send({
                error: "User does not exist. Please enter valid details"
            });
            return;
        };

        const isValidPassword = await bcrypt.compare(password, savedUserData.password);

        if (isValidPassword) {
            const token = jwt.sign({ userName }, proceess.env.TOKEN_KEY, { expiresIn: "24h" });
            savedUserData.token = token;
            await savedUserData.save();
            response.status(200).send({ token });
        } else {
            response.status(200).send({ error: "Wrong password entered" });
        };

    } catch (err) {
        console.log(err);
        response.status(400).send({ error: "Some error occurred." });
    };

    return;
});

module.exports = router;
