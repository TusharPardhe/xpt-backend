const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Client } = require('xrpl');

const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');

const fetchAccountDetails = async (req, res) => {
    const { address } = req.query;

    if (!address) {
        return res.status(400).send({ error: API_RESPONSE_CODE[400] });
    }

    try {
        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        const newAccount = await client
            .request({
                command: 'account_info',
                account: address,
            })
            .catch((err) => err.error === 'actNotFound');

        if (newAccount) {
            return res.status(200).send({
                isApprover: false,
                totalNumberOfEscrows: 0,
                suitCoinBalance: 0,
                issuedCurrencies: [],
                xrpBalance: 0,
                newAccount: true,
            });
        }

        const [isApprover, totalNumberOfEscrows, gateway_balances, account_lines, xrpScan] = await Promise.all([
            Approver.findOne({ address }),
            Escrow.countDocuments({ completed: false }),
            client.request({
                command: 'gateway_balances',
                ledger_index: 'validated',
                account: address,
            }),
            client.request({
                command: 'account_lines',
                ledger_index: 'validated',
                account: address,
            }),
            fetch(`https://api.xrpscan.com/api/v1/account/${address}`).then((res) => res.json()),
        ]);

        const suitCoin = account_lines.result.lines.find(
            (line) => line.currency === process.env.SUIT_COIN_HEX && line.account === process.env.SUIT_COIN_ISSUER
        );

        const accountData = {
            isApprover: !!isApprover,
            totalNumberOfEscrows,
            suitCoinBalance: suitCoin ? suitCoin.balance : 0,
            issuedCurrencies: gateway_balances.result.obligations,
            xrpBalance: xrpScan.xrpBalance - (10 + 2 * xrpScan.ownerCount),
            newAccount: false,
        };

        res.status(200).send(accountData);
        await client.disconnect();
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = fetchAccountDetails;
