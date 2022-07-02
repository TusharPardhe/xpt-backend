const mongoose = require("mongoose");

const Airdrop = new mongoose.Schema({
    projectName: {
        type: String,
        required: [true, "Project name is mandatory"],
    },
    ticker: {
        type: String,
        required: [true, "Ticker symbol is mandatory"],
    },
    issuer: {
        type: String,
        required: [true, "Issuer account is mandatory"],
    },
    currencyName: {
        type: String,
        required: [true, "Currency Name is mandatory"],
    },
    date: {
        type: String,
        required: [true, "Airdrop date is mandatory"],
    },
    addedByAccount: {
        type: String,
        required: [true, "Account adding the details is mandatory"],
    },
    logo: {
        type: String,
    },
    blackholed: {
        type: Boolean,
    },
    xummKyc: {
        type: Boolean,
    },
    noFreeze: {
        type: Boolean,
    },
    socials: {
        type: Array,
        default: [],
    },
    description: {
        type: String,
        default: "",
    },
    show: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Airdrop", Airdrop);