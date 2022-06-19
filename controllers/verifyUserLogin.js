const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const { ERROR_CODES } = require("../constants/app.constants");
const UserSchema = require("../models/UserSchema");

const verifyUserLogin = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send(ERROR_CODES[400]);
            return;
        }

        const { userName, password } = body;

        if (!(userName && password)) {
            response.status(400).send({ error: ERROR_CODES[400] });
            return;
        }

        const savedUserData = (await UserSchema.findOne({ userName })) || (await UserSchema.findOne({ address: userName }));

        if (!savedUserData) {
            response.status(404).send({
                error: ERROR_CODES[404],
            });
            return;
        }
        const isValidPassword = await bcrypt.compare(password, savedUserData.password);

        if (isValidPassword) {
            const token = jwt.sign({ userName }, process.env.TOKEN_KEY, { expiresIn: "84h" });
            response.status(200).send({ token });
        } else {
            response.status(403).send({ error: ERROR_CODES[403] });
        }
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: ERROR_CODES[500] });
    }
    return;
};

module.exports = verifyUserLogin;
