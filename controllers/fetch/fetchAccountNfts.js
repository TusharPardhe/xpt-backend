const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Client, convertHexToString } = require('xrpl');

const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');

const fetchAccountNfts = async (req, res) => {
    const { account, marker, limit } = req.body;

    if (!account) {
        return res.status(400).send({ error: API_RESPONSE_CODE[400] });
    }

    try {
        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        const newAccount = await client
            .request({
                command: 'account_info',
                account,
            })
            .then((res) => {
                return false;
            })
            .catch((err) => {
                if (err.data.error === 'actNotFound') {
                    return true;
                }
                return false;
            });

        if (newAccount) {
            await client.disconnect();
            return res.status(200).send({
                account_nfts: [],
                error: 'Account not found',
            });
        }

        const account_nfts = await client.request({
            command: 'account_nfts',
            account,
            marker: marker ?? undefined,
            limit,
        });

        if (account_nfts.result.account_nfts) {
            account_nfts.result.account_nfts = account_nfts.result.account_nfts.map((nft) => {
                return {
                    ...nft,
                    URI: nft.URI ? convertHexToString(nft.URI) : '',
                };
            });
        }

        res.status(200).send(account_nfts.result);
        await client.disconnect();
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

module.exports = fetchAccountNfts;
