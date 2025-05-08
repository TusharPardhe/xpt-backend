const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Client } = require('xrpl');

const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');

const fetchAccountDetails = async (req, res) => {
    const { address, trustlineLimit } = req.query;

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
                revoCoinBalance: 0,
                issuedCurrencies: [],
                xrpBalance: 0,
                newAccount: true,
                trustLines: [],
            });
        }

        let [isApprover, totalCompletedEscrows, totalPendingEscrows, gateway_balances, account_lines, xrpScan, server_info] =
            await Promise.all([
                Approver.findOne({ address }),
                Escrow.countDocuments({ completed: true, address }),
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
                    limit: trustlineLimit ? parseInt(trustlineLimit) : 200,
                }),
                fetch(`https://api.xrpscan.com/api/v1/account/${address}`).then((res) => res.json()),
                client.request({
                    command: 'server_info',
                }),
            ]);

        const revoCoin = account_lines.result.lines.find(
            (line) => line.currency === process.env.REVO_COIN_HEX && line.account === process.env.REVO_COIN_ISSUER
        );

        if (address === process.env.REVO_COIN_ISSUER) {
            return res.status(200).send({
                isApprover: true,
                escrowCount: {
                    total: totalCompletedEscrows + totalPendingEscrows,
                    completed: totalCompletedEscrows,
                    outstanding: totalPendingEscrows,
                },
                totalPendingEscrows,
                hasRevoCoinTrustline: true,
                revoCoinBalance: -1 * account_lines.result.lines.find((line) => line.currency === process.env.REVO_COIN_HEX).balance,
                issuedCurrencies: gateway_balances.result.obligations,
                xrpBalance:
                    xrpScan.xrpBalance -
                    (server_info.result.info.validated_ledger.reserve_base_xrp +
                        server_info.result.info.validated_ledger.reserve_inc_xrp * xrpScan.ownerCount),
                newAccount: false,
                trustLines: account_lines.result.lines ?? [],
            });
        }

        if (!!isApprover) {
            totalCompletedEscrows = await Escrow.countDocuments({ completed: true });
            totalPendingEscrows = await Escrow.countDocuments({ completed: false });
        }

        const accountData = {
            isApprover: !!isApprover,
            escrowCount: {
                total: totalCompletedEscrows + totalPendingEscrows,
                completed: totalCompletedEscrows,
                outstanding: totalPendingEscrows,
            },
            hasRevoCoinTrustline: !!revoCoin,
            revoCoinBalance: revoCoin ? parseFloat(revoCoin.balance) : 0,
            issuedCurrencies: gateway_balances.result.obligations,
            xrpBalance:
                xrpScan.xrpBalance -
                (server_info.result.info.validated_ledger.reserve_base_xrp +
                    server_info.result.info.validated_ledger.reserve_inc_xrp * xrpScan.ownerCount),
            newAccount: false,
            trustLines: account_lines.result.lines ?? [],
        };

        res.status(200).send(accountData);
        await client.disconnect();
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

module.exports = fetchAccountDetails;
