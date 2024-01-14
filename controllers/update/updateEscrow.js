const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');

const updateEscrow = async (req, res) => {
    const { id, approver } = req.body;

    try {
        if (!id || !approver) {
            throw new Error('Missing parameters');
        }

        const escrow = await Escrow.findOne({ id });
        if (!escrow) {
            return res.status(404).json({ status: 'error', error: 'Escrow not found' });
        }

        const isApprover = await Approver.findOne({ address: approver });

        if (!isApprover) {
            return res.status(401).json({ status: 'error', error: 'Unauthorized' });
        }

        if (escrow.approvedBy.includes(approver)) {
            return res.status(200).json({ status: 'error', error: 'Already approved' });
        }

        const result = await Escrow.updateOne({ id }, { $push: { approvedBy: approver } });

        return res.json({ status: 'success', result });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
};

module.exports = updateEscrow;
