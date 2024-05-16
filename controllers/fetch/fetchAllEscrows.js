const { APPROVER_NAMES } = require('../../constants/app.constants');
const Approver = require('../../models/Approver');
const Escrow = require('../../models/Escrow');

const fetchAllEscrows = async (req, res) => {
    try {
        // Pagination Parameters
        let { page, limit, address, id } = req.query;

        if (!address || address === '') {
            return res.status(400).send({ error: 'Bad request' });
        }

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

        let sortCriteria = { _id: -1 }; // Default sorting by _id
        if (req.query.sortBy === 'time') {
            sortCriteria = { time: 1 }; // Sort by time in ascending order
        }

        let escrows = await Escrow.find(query).skip(skip).limit(limit).sort(sortCriteria);
        escrows = escrows.map(({ _doc: escrow }) => {
            let approvers = escrow.approvedBy;
            if (approvers?.length > 0) {
                approvers = approvers.map((approver) => {
                    return APPROVER_NAMES[approver] ?? approver;
                });
            }

            return {
                ...escrow,
                approvedBy: approvers,
                createdBy: APPROVER_NAMES[escrow.createdBy] ?? escrow.createdBy,
            };
        });

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
