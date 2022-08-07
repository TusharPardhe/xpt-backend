const { Client } = require("xrpl");

const { API_RESPONSE_CODE } = require("../constants/app.constants");

const fetchAccountTransactions = async (request, response) => {
    try {
        if (!request.body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        let { account, userName, limit, ...otherParams } = request.body;
        limit = limit ?? 25;

        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        if (!(account && limit)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const transactionDetails = await client
            .request({
                command: "account_tx",
                account,
                limit,
                ...otherParams,
            })
            .catch((err) => {
                response.status(500).send({ error: err.data.error_message });
                return;
            });

        if (transactionDetails) {
            response.status(200).send({ ...transactionDetails.result });
        }
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = fetchAccountTransactions;
