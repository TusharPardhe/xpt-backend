const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Client } = require("xrpl");
const { API_RESPONSE_CODE } = require("../constants/app.constants");

const fetchXrplAccountDetails = async (request, response) => {

    try {
        if (!request.body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const { body: { account } } = request;

        if (!account) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        let accountData = {
            dataFromXrpScan: {},
            otherCurrencies: [],
            issuedFungibleTokens: {},
        };

        await fetch(`https://api.xrpscan.com/api/v1/account/${account}`)
            .then((res) => res.json())
            .then((res) => {
                accountData.dataFromXrpScan = res;
            });

        const account_lines = await client.request({
            command: "account_lines",
            ledger_index: "validated",
            limit: 52,
            account,
        });

        const gateway_balances = await client.request({
            command: "gateway_balances",
            ledger_index: "validated",
            account,
        });

        if (account_lines.result.lines) {
            accountData.otherCurrencies = account_lines.result.lines;
        }

        if (gateway_balances.result.obligations) {
            accountData.issuedFungibleTokens = gateway_balances.result.obligations;
        };

        response.status(200).send({ ...accountData });
        await client.disconnect();

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };

    return;
};

module.exports = fetchXrplAccountDetails;