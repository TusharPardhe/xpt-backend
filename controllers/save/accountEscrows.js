const { Client, Wallet } = require('xrpl');
const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');
const { v4: uuidv4 } = require('uuid');

const accountEscrows = async (req, res) => {
    const { account, time, txs, createdBy, approvedBy } = req.body;

    try {
        if (!account || !txs || !createdBy || !approvedBy) {
            throw new Error('Missing parameters');
        }

        const approver = await Approver.findOne({ address: approvedBy });

        if (!approver) {
            throw new Error('Approver not found');
        }

        // Save new escrow
        const newId = uuidv4();
        await Escrow.create({
            address: account,
            txs,
            createdBy,
            approvedBy,
            time,
            id: newId,
            completed: false,
        });

        res.json({ status: 'success', id: newId });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
};

module.exports = accountEscrows;
