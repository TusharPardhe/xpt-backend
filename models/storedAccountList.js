const mongoose = require("mongoose");

const storedAccountList = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "User name is mandatory"],
    },
    accounts: {
        type: Object,
        required: [true, "XRPL accounts data missing."],
        default: {},
    },
});

module.exports = mongoose.model("storedAccountList", storedAccountList);
