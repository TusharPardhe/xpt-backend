const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = require('../../models/UserSchema');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

const sendJwt = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send(API_RESPONSE_CODE[400]);
            return;
        }

        const { userAddress } = body;

        if (!userAddress) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const token = jwt.sign({ userAddress }, process.env.TOKEN_KEY);

        response.status(200).send({ token, type: 'admin' });
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = sendJwt;
