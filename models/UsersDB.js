const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

let UsersDB = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "Username is mandatory"],
        unique: true,
    },
    address: {
        type: String,
        required: [true, "XRPL address is mandatory"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is mandatory"],
    },
    token: {
        type: String,
    },
});

UsersDB.pre("save", async function (next) {
    try {
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(this.password, salt);
        this.password = passwordHash;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("UsersDB", UsersDB);
