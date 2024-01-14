const Escrow = require('../../models/Escrow');

const fetchAccountEscrows = async (req, res) => {
    try {
        const { address, id } = req.body;
        let { page, limit } = req.body;

        if (!address) {
            throw new Error('Missing address parameter');
        }

        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 100;
        const skip = (page - 1) * limit;

        let query = { address };
        if (id) {
            query.id = id;
        }

        // Query with Pagination
        const escrows = await Escrow.find(query).skip(skip).limit(limit);
        const total = await Escrow.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                escrows,
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message,
        });
    }
};

module.exports = fetchAccountEscrows;
