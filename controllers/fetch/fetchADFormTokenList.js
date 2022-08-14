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

        if (existingADs && existingADs.length > 0) {
            existingADs.forEach((AD) => {
                delete gateway_balances.result.obligations[AD.ticker];
            });
        };

        const currencies = {};
        Object.keys(gateway_balances.result.obligations).forEach((currency) => {
            let c = currency.length === 40 ? convertHexToString(currency).replaceAll("\u0000", "") : currency;
            currencies[c] = {
                issuer: userFromDB.address,
                limit: gateway_balances.result.obligations[currency],
                hex: currency
            }
        });

        if (!currencies || Object.keys(currencies).length === 0) {
            return response.status(200).send({ currencies: [], message: "You've already submitted your requests." });
        }

        const xrpl_currency_list = Object.keys(currencies).map((a) => ({ key: a, value: currencies[a].hex, text: a, limit: currencies[a].limit }));

        response.status(200).send({ currencies: xrpl_currency_list, message: "" });
        await client.disconnect();
        
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = fetchADFormTokenList;
