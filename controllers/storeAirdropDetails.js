const { Client } = require("xrpl");
const Airdrop = require("../models/Airdrop");

const { API_RESPONSE_CODE, XRPL_ACCOUNT_FLAGS_DECIMAL_VALUES } = require("../constants/app.constants");
const { DISABLE_MASTER_KEY, NO_FREEZE } = XRPL_ACCOUNT_FLAGS_DECIMAL_VALUES

const storeAirdropDetails = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        let { projectName, ticker, currencyName, date, issuer, addedByAccount, blackholed, noFreeze, links, description } = body;

        if (!(projectName && ticker && currencyName && date && issuer && addedByAccount)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const doesCoinAlreadyExist = await Airdrop.findOne({ currencyName });
        const doesTickerExist = await Airdrop.findOne({ ticker });

        if (doesCoinAlreadyExist && doesCoinAlreadyExist.issuer === issuer) {
            response.status(409).send({ error: API_RESPONSE_CODE[409] });
            return;
        }

        if (doesTickerExist && doesTickerExist.issuer === issuer) {
            response.status(409).send({ error: API_RESPONSE_CODE[409] });
            return;
        }

        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        const issuerAccountDetails = await client.request({
            command: "account_info",
            account: issuer,
        });

        if (issuerAccountDetails.result) {
            const accountFlags = issuerAccountDetails.result.account_data.Flags;
            blackholed = !!(DISABLE_MASTER_KEY && accountFlags);
            noFreeze = !!(NO_FREEZE && accountFlags);
        }

        const dataToStore = {
            projectName,
            ticker,
            currencyName,
            date: parseInt(date),
            issuer,
            addedByAccount,
            blackholed,
            noFreeze,
            links,
            description,
            show: true,
        };

        const airdrop = new Airdrop(dataToStore);
        await airdrop.save();

        response.status(200).send({ success: API_RESPONSE_CODE[200] });
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = storeAirdropDetails;
