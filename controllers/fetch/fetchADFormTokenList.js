const { Client, convertHexToString } = require("xrpl");

const Airdrop = require("../../models/Airdrop");
const UserSchema = require("../../models/UserSchema");

const { API_RESPONSE_CODE } = require("../../constants/app.constants");

const fetchADFormTokenList = async (request, response) => {
    if (!request.body) {
        response.status(400).send({ error: API_RESPONSE_CODE[400] });
        return;
    }

    try {
        const { userName } = request.body;
        const userFromDB = await UserSchema.findOne({ userName });
        if (!userFromDB) {
            return response.status(400).send({ error: API_RESPONSE_CODE[400] });
        }

        const existingADs = await Airdrop.find();

        // List of issued tokens
        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        const account_lines = await client.request({
            command: "account_lines",
            ledger_index: "validated",
            limit: 52,
            account: userFromDB.address,
        });

        if (account_lines.result.lines.length === 0) {
            return response.status(200).send({ currencies: [], message: "No trustlines found.", listingFees: 5 });
        };

        const currencies = {};
        const drops = {};

        if (existingADs && existingADs.length > 0) {
            existingADs.forEach((AD) => {
                drops[AD.ticker] = true;
            });
        };

        account_lines.result.lines.map(({ currency, account, limit, balance }) => {
            let c = currency.length === 40 ? convertHexToString(currency).replaceAll("\u0000", "") : currency;
            if (!drops[currency] && balance >= 0) {
                currencies[c] = {
                    issuer: account,
                    limit: limit,
                    hex: currency
                }
            };
        });

        if (!currencies || Object.keys(currencies).length === 0) {
            return response.status(200).send({ currencies: [], message: "You've already submitted your requests.", listingFees: 5 });
        }

        const xrpl_currency_list = Object.keys(currencies).map((a) => ({ key: a, value: currencies[a].hex, text: a, limit: currencies[a].limit, issuer: currencies[a].issuer }));

        response.status(200).send({ currencies: xrpl_currency_list, message: "", listingFees: 5 });
        await client.disconnect();
        
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = fetchADFormTokenList;
