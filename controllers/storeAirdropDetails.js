const { API_RESPONSE_CODE } = require("../constants/app.constants");
const Airdrop = require("../models/Airdrop");

const storeAirdropDetails = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const { projectName, ticker, currencyName, date, issuer, addedByAccount, blackholed, xummKyc, noFreeze, socials, description, logo } = body;

        if (!(projectName && ticker && currencyName && date && issuer && addedByAccount)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const doesCoinAlreadyExist = await Airdrop.findOne({ currencyName });

        if (doesCoinAlreadyExist) {
            response.status(409).send({ error: API_RESPONSE_CODE[409] });
            return;
        }

        const dataToStore = {
            projectName,
            ticker,
            currencyName,
            date,
            issuer,
            addedByAccount,
            blackholed,
            xummKyc,
            noFreeze,
            socials,
            description,
            logo,
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
