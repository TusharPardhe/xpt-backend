const { convertStringToHex } = require("xrpl");
const { XummSdk } = require("xumm-sdk");

const { API_RESPONSE_CODE } = require("../../constants/app.constants");


const xummTransaction = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const Sdk = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET)
        const { txJSON } = body;

        if (!txJSON) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const payload = await Sdk.payload.create(txJSON, true);
        response.status(200).send({ png: payload.refs.qr_png });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };
    return;
};

module.exports = xummTransaction;