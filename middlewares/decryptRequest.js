const { AES, enc } = require("crypto-js");
const dotenv = require("dotenv");
dotenv.config();

const decryptJSON = (req, res, next) => {
    const { body } = req;

    if (!body || !body.encryptedRequest) {
        res.status(400).send({ error: "Bad request." });
        return;
    }

    const decryptedRes = AES.decrypt(body.encryptedRequest, process.env.ENCRYPTION_KEY);
    req.body = JSON.parse(decryptedRes.toString(enc.Utf8));
    next();
};

module.exports = decryptJSON;
