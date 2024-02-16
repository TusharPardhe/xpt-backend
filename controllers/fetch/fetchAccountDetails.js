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
                isApprover: false,
                totalNumberOfEscrows: 0,
                suitCoinBalance: 0,
                issuedCurrencies: [],
                xrpBalance: 0,
                newAccount: true,
            });
        }

        let [isApprover, totalNumberOfEscrows, gateway_balances, account_lines, xrpScan] = await Promise.all([
            Approver.findOne({ address }),
            Escrow.countDocuments({ completed: false, address }),
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

        if (address === process.env.SUIT_COIN_ISSUER) {
            return res.status(200).send({
                isApprover: true,
                totalNumberOfEscrows,
                hasSuitCoinTrustline: true,
                suitCoinBalance: -1 * account_lines.result.lines.find((line) => line.currency === process.env.SUIT_COIN_HEX).balance,
                issuedCurrencies: gateway_balances.result.obligations,
                xrpBalance: xrpScan.xrpBalance - (10 + 2 * xrpScan.ownerCount),
                newAccount: false,
            });
        }

        if (!!isApprover) {
            totalNumberOfEscrows = await Escrow.countDocuments({ completed: false });
        }

        const accountData = {
            isApprover: !!isApprover,
            totalNumberOfEscrows,
            hasSuitCoinTrustline: !!suitCoin,
            suitCoinBalance: suitCoin ? parseFloat(suitCoin.balance) : 0,
            issuedCurrencies: gateway_balances.result.obligations,
            xrpBalance: xrpScan.xrpBalance - (10 + 2 * xrpScan.ownerCount),
            newAccount: false,
        };

        res.status(200).send(accountData);
        await client.disconnect();
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

module.exports = fetchAccountDetails;
