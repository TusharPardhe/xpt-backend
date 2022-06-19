const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const UserSchema = require("../models/UserSchema");

const verifyUserLogin = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send(`Bad request. Missing request body.`);
            return;
        }

        const { userName, password } = body;

        if (!(userName && password)) {
            response.status(400).send({ error: "Bad request. Please check request" });
            return;
        }

        const savedUserData = (await UserSchema.findOne({ userName })) || (await UserSchema.findOne({ address: userName }));

        if (!savedUserData) {
            response.status(409).send({
                error: "User does not exist. Please enter valid details",
            });
            return;
        }
        const isValidPassword = await bcrypt.compare(password, savedUserData.password);

        if (isValidPassword) {
            const token = jwt.sign({ userName }, process.env.TOKEN_KEY, { expiresIn: "84h" });
            response.status(200).send({ token });
        } else {
            response.status(200).send({ error: "Wrong password entered" });
        }
    } catch (err) {
        console.log(err);
        response.status(400).send({ error: "Some error occurred." });
    }
    return;
};

module.exports = verifyUserLogin;
