const { XummSdk } = require("xumm-sdk");

const { API_RESPONSE_CODE } = require("../constants/app.constants");

const verifyUserAddressViaXumm = async (request, response) => {
    try {
        const Sdk = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET);
        const request = { TransactionType: "SignIn" };
        const payload = await Sdk.payload.create(request, true);
        response.status(200).send(payload);
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = verifyUserAddressViaXumm;
