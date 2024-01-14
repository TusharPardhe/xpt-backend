const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');

const fetchAllEscrows = async (req, res) => {
    try {
        // Pagination Parameters
        let { page, limit, address, id } = req.query;
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 100;
        const skip = (page - 1) * limit;
        const isApprover = await Approver.findOne({ address });

        // Query with Pagination
        let query = {};

        if (address && !isApprover) {
            query.address = address;
        }

        if (id) {
            query.id = id;
        }

        const escrows = await Escrow.find(query).skip(skip).limit(limit).sort({ _id: -1 });
        // count all documents by query
        const total = await Escrow.countDocuments(query);

        res.json({
            status: 'success',
            escrows,
            total,
            page,
            isApprover: !!isApprover,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message,
        });
    }
};

module.exports = fetchAllEscrows;
