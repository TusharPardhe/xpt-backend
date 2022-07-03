const Airdrop = require("../models/Airdrop");
const { API_RESPONSE_CODE } = require("../constants/app.constants");

const fetchAirdropsList = async (request, response) => {
    try {
        let {
            query: { offset, limit, pageNumber, toDate, fromDate, date },
        } = request;

        // conversions and default values
        if (date) {
            toDate = new Date(parseInt(date)).setHours(23, 59, 59, 999);
            fromDate = new Date(parseInt(date)).setHours(0, 0, 0, 0);
        };

        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 100;
        fromDate = fromDate ? parseInt(fromDate) : new Date().setHours(0, 0, 0, 0);
        toDate = toDate ? parseInt(toDate) : new Date().setHours(23, 59, 59, 999);
        pageNumber = pageNumber ? parseInt(pageNumber) - 1 : 0;

        if (offset < 0 || limit < 0 || pageNumber < 0 || limit > 100) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        // getting data from db
        const list = await Airdrop.find({
            date: {
                $gte: fromDate,
                $lte: toDate,
            }
        });

        // getting useful information
        let airdropsList = list
            ? list.map((airdrop) => {
                const {
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
                    show,
                    logo,
                } = airdrop;
                const details = {
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
                };

                if (show) {
                    return details;
                }
            })
            : [];

        // slicing array based on query params
        const startingIndex = pageNumber * limit + offset;
        const endingIndex = limit + startingIndex;
        airdropsList = airdropsList.slice(startingIndex, endingIndex);

        response.status(200).send({
            list: airdropsList,
            totalCount: list.length,
        });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = fetchAirdropsList;
