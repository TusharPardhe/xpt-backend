const Airdrop = require("../models/Airdrop");

const storeAirdropDetails = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send({ error: `Bad request. Missing request body.` });
            return;
        }

        const { projectName, ticker, currencyName, date, issuer, addedByAccount, blackholed, xummKyc, noFreeze, socials, description } = body;

        if (!(projectName && ticker && currencyName && date && issuer && addedByAccount)) {
            response.status(400).send({ error: `Bad request. Mandatory field missing.` });
            return;
        }

        const doesCoinAlreadyExist = await Airdrop.findOne({ currencyName });

        if (doesCoinAlreadyExist) {
            response.status(409).send({ error: "Airdrop details already exists." });
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
            show: true,
        };

        const airdrop = new Airdrop(dataToStore);
        await airdrop.save();

        response.status(200).send({ success: "Data saved successfully!" });
    } catch (err) {
        console.log(err);
        response.status(400).send(err);
    }
    return;
};

module.exports = storeAirdropDetails;
