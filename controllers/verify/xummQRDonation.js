const { convertStringToHex } = require("xrpl");
const { XummSdk } = require("xumm-sdk");

const { API_RESPONSE_CODE } = require("../../constants/app.constants");


const xummQRDonation = async (request, response) => {

    const { body } = request;

    if (!body) {
        response.status(400).send({ error: API_RESPONSE_CODE[400] });
        return;
    };

    try {

        const Sdk = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET)
        const { amount, memo } = body;

        if (!amount || amount.length === 0) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const request = {
            "TransactionType": "Payment",
            "Destination": process.env.DONATION_ADDRESS,
            "Amount": amount,
            "Memos": []
        };

        if (memo) {
            request.Memos.push({
                "Memo": {
                    "MemoData": convertStringToHex(memo)
                }
            });
        };

        const payload = await Sdk.payload.create(request, true);

        response.status(200).send({
            png: payload.refs.qr_png
        });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };
};

module.exports = xummQRDonation;