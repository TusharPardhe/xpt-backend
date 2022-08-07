const jwt = require("jsonwebtoken");
const { API_RESPONSE_CODE } = require("../constants/app.constants");

const verifyJwt = (req, res, next) => {
    const token = req.body.token;

    if (!token) {
        res.status(403).send({ error: "A token is required for authentication" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        delete req.body.token;
        if (req.body.userName === decoded.userName) {
            req.body.authenticated = true;
        } else {
            return res.status(401).send("Invalid Token");
        }
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyJwt;