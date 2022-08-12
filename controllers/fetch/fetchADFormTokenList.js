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

        const existingADs = await Airdrop.find({ issuer: userFromDB.address });

        // List of issued tokens
        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        const gateway_balances = await client.request({
            command: "gateway_balances",
            account: userFromDB.address,
            ledger_index: "validated",
        });

        if (!gateway_balances?.result?.obligations || Object.keys(gateway_balances.result.obligations).length === 0) {
            return response
                .status(200)
                .send({ currencies: [], message: "Token issuers can request for an airdrop listing. Please login using an issuer account." });
        }

        const currencies = {};
        Object.keys(gateway_balances.result.obligations).forEach((currency) => {
            currency = currency.length === 40 ? convertHexToString(currency).replaceAll("\u0000", "") : currency;
            currencies[currency] = userFromDB.address;
        });

        if (existingADs && existingADs.length > 0) {
            existingADs.forEach((AD) => {
                if (currencies[AD.ticker] && currencies[AD.ticker] === AD.issuer) {
                    delete currencies[AD.ticker];
                }
            });
        }

        if (!currencies || Object.keys(currencies).length === 0) {
            return response.status(200).send({ currencies: [], message: "You've already submitted your requests." });
        }

        const xrpl_currency_list = Object.keys(currencies).map((a) => ({ key: a, value: a, text: a }));

        response.status(200).send({ currencies: xrpl_currency_list, message: "" });
        await client.disconnect();
        
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = fetchADFormTokenList;
