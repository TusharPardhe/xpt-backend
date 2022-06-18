const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const verifyJwt = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers["access-token"];

    if (!token) {
        res.status(403).send({ error: "A token is required for authentication" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.body.authenticated = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyJwt;