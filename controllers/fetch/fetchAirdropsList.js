const Airdrop = require("../../models/Airdrop");
const { API_RESPONSE_CODE, MAX_LIMIT_FOR_FETCHING_LIST } = require("../../constants/app.constants");

const fetchAirdropsList = async (request, response) => {
    try {
        let {
            query: { offset, limit, pageNumber, toDate, fromDate, date },
        } = request;

        // conversions and default values
        if (date) {
            fromDate = date;
            toDate = null;
        };

        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 100;
        fromDate = fromDate ? parseInt(fromDate) : new Date().setHours(0, 0, 0, 0) / 1000;
        toDate = toDate ? parseInt(toDate) : null;
        pageNumber = pageNumber ? parseInt(pageNumber) - 1 : 0;

        if (offset < 0 || limit < 0 || pageNumber < 0 || limit > MAX_LIMIT_FOR_FETCHING_LIST) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        // getting data from db
        let schemaDateFilter = {};
        if (toDate) { schemaDateFilter.$lte = toDate; };
        if (fromDate) { schemaDateFilter.$gte = fromDate; }
        const list = await Airdrop.find({ date: { ...schemaDateFilter } });

        // getting useful information
        let airdropsList = list
            ? list.map((airdrop) => {
                const { projectName, ticker, currencyName, date, issuer, logo, addedByAccount, blackholed, noFreeze, links, description, show, maxSupply } =
                    airdrop;
                const details = {
                    projectName,
                    ticker,
                    currencyName,
                    date,
                    issuer,
                    addedByAccount,
                    blackholed,
                    noFreeze,
                    links,
                    description,
                    logo,
                    maxSupply,
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
