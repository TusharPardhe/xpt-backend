const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { convertHexToString } = require('xrpl');

const { API_RESPONSE_CODE, MAX_LIMIT_FOR_FETCHING_LIST } = require("../../constants/app.constants");

const getTokenName = (value) => value.length === 40 ? convertHexToString(value).replaceAll("\u0000", "") : value;

const compareCurrencyName = (searchValue, currency) => {
    if (!(searchValue && currency)) {
        return false;
    }
    currency = getTokenName(currency).toLowerCase();
    searchValue = searchValue.toLowerCase();
    return currency.includes(searchValue);
};

const fetchXrplFungibleTokenList = async (request, response) => {
    try {
        let {
            query: { offset, limit, pageNumber, searchValue, apiLimit, sort_by },
        } = request;
        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 100;
        sort_by = sort_by ?? "trustlines";
        apiLimit = apiLimit ?? 100;
        pageNumber = pageNumber ? parseInt(pageNumber) - 1 : 0;

        if (offset < 0 || limit < 0 || pageNumber < 0 || limit > MAX_LIMIT_FOR_FETCHING_LIST) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        let data = await fetch(`https://s1.xrplmeta.org/tokens?limit=${apiLimit}&sort_by=${sort_by}`).then((res) => {
            return res.json();
        });

        if (searchValue) {
            data = data.filter(({ currency }) => compareCurrencyName(searchValue, currency));
        }

        if (!data) {
            response.status(500).send({ error: API_RESPONSE_CODE[500] });
            return;
        }

        // slicing array based on query params
        const startingIndex = pageNumber * limit + offset;
        const endingIndex = limit + startingIndex;
        const filteredTokenList = data.slice(startingIndex, endingIndex);

        response.status(200).send({
            filteredCount: filteredTokenList.length,
            totalCount: data.length,
            list: filteredTokenList,
        });
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }

    return;
};

module.exports = fetchXrplFungibleTokenList;