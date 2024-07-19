const Escrow = require('../../models/Escrow');

const fetchTreasuryDetails = async (req, res) => {
    try {
        let { address } = req.query;

        if (!address || address === '') {
            return res.status(400).send({ error: 'Address is mandatory' });
        }

        // Calculate total escrowed amount
        const totalEscrowedAggregate = await Escrow.aggregate([
            { $match: { completed: false } },
            { $unwind: '$txs' },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $toDouble: '$txs.Amount.value',
                        },
                    },
                },
            },
        ]);
        const totalEscrowed = totalEscrowedAggregate.length > 0 ? totalEscrowedAggregate[0].total : 0;

        // Calculate user's escrowed amount
        const userEscrowedAggregate = await Escrow.aggregate([
            { $match: { address, completed: false } },
            { $unwind: '$txs' },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $toDouble: '$txs.Amount.value',
                        },
                    },
                },
            },
        ]);
        const userEscrowed = userEscrowedAggregate.length > 0 ? userEscrowedAggregate[0].total : 0;

        res.json({
            status: 'success',
            data: {
                userEscrowed,
                totalEscrowed,
            },
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message,
        });
    }
};

module.exports = fetchTreasuryDetails;
