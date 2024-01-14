const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');
const { Client, Wallet } = require('xrpl');

const sendEscrowTransactions = async (req, res) => {
    try {
        const client = new Client(process.env.XRPL_SERVER);
        await client.connect();
        const updatedEscrows = [];
        // find escrows less than or equal to current time
        const escrows = await Escrow.find({ time: { $lte: Date.now() }, completed: false });

        if (escrows.length === 0) {
            return res.json({ status: 'success', message: 'All escrows are either completed or not yet ready to be sent.' });
        }

        // send transaction for each escrow
        for (i in escrows) {
            const txs = escrows[i].txs;
            const approvedBy = escrows[i].approvedBy;
            const approvers = await Approver.find({});
            const allApproversAgreed = approvers.every(({ address }) => approvedBy.includes(address));

            if (allApproversAgreed) {
                for (j in txs) {
                    const transaction = txs[j];
                    const prepared = await client.autofill(transaction);
                    const wallet = Wallet.fromSeed(process.env.XRPL_SECRET);
                    const txResult = await client.submit(prepared, { wallet });

                    if (txResult.result.engine_result === 'tesSUCCESS') {
                        updatedEscrows.push(escrows[i].id);
                        await Escrow.updateOne({ id: escrows[i].id }, { $set: { completed: true } });
                    } else {
                        console.error(txResult);
                        throw new Error('Transaction failed');
                    }
                }
            } else {
                return res.json({ error: 'Not all approvers agreed' });
            }
        }

        return res.json({ status: 'success', updatedEscrows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

module.exports = sendEscrowTransactions;
