const { Client, convertStringToHex, convertHexToString } = require('xrpl');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

const fetchPatientEncryptedData = async (req, res) => {
    try {
        const { txID } = req.query;

        if (!txID) {
            return res.status(400).send({ error: API_RESPONSE_CODE[400] });
        }

        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        // const txDetails = await fetch(`https://api.xrpscan.com/api/v1/tx/${txID}`).then((res) => res.json());

        const txDetails = await client.request({
            command: 'tx',
            binary: false,
            transaction: txID,
        });

        await client.disconnect();

        let url = '';

        if (txDetails.result.URI) {
            url = convertHexToString(txDetails.result.URI);
        }

        const nftData = await fetch(url).then((res) => res.json());

        return res.status(200).send(nftData);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = fetchPatientEncryptedData;
