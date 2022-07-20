const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { API_RESPONSE_CODE, MAX_LIMIT_FOR_FETCHING_LIST } = require("../constants/app.constants");

const fetchXrplFungibleTokenList = async (request, response) => {

    try {
        let { query: { offset, limit, pageNumber } } = request;
        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 100;
        pageNumber = pageNumber ? parseInt(pageNumber) - 1 : 0;

        if (offset < 0 || limit < 0 || pageNumber < 0 || limit > MAX_LIMIT_FOR_FETCHING_LIST) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const data = await fetch(`https://api.onthedex.live/public/v1/aggregator`).then((res) => { return res.json(); });

        if (!(data && data.tokens)) {
            response.status(500).send({ error: API_RESPONSE_CODE[500] });
            return;
        };

        // slicing array based on query params
        const totalTokenList = data.tokens;
        const startingIndex = pageNumber * limit + offset;
        const endingIndex = limit + startingIndex;
        const filteredTokenList = totalTokenList.slice(startingIndex, endingIndex);

        response.status(200).send({
            filteredCount: filteredTokenList.length,
            totalCount: totalTokenList.length,
            list: filteredTokenList,
        });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };

    return;
};

module.exports = fetchXrplFungibleTokenList;