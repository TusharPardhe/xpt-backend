const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const { API_RESPONSE_CODE } = require("../constants/app.constants");
const UserSchema = require("../models/UserSchema");

const verifyUserLogin = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send(API_RESPONSE_CODE[400]);
            return;
        }

        const { userName, password } = body;

        if (!(userName && password)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const savedUserData = (await UserSchema.findOne({ userName })) || (await UserSchema.findOne({ address: userName }));

        if (!savedUserData) {
            response.status(404).send({
                error: API_RESPONSE_CODE[404],
            });
            return;
        }
        const isValidPassword = await bcrypt.compare(password, savedUserData.password);

        if (isValidPassword) {
            const token = jwt.sign({ userName: savedUserData.userName }, process.env.TOKEN_KEY, { expiresIn: "84h" });
            response.status(200).send({ token, userName: savedUserData.userName, xrplAddress: savedUserData.address });
        } else {
            response.status(403).send({ error: API_RESPONSE_CODE[403] });
        }
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = verifyUserLogin;
