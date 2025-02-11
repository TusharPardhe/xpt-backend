const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const Record = require('../../models/Record');

const fetchAccountRecords = async (req, res) => {
    try {
        const { account, page = 1, limit = 10 } = req.query;

        if (!account) {
            return res.status(400).send({ error: API_RESPONSE_CODE[400] });
        }

        const pageNumber = Math.max(1, parseInt(page));
        const limitNumber = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNumber - 1) * limitNumber;

        const records = await Record.find({ minterAddress: account }).sort({ createdAt: -1 }).skip(skip).limit(limitNumber);
        const totalRecords = await Record.countDocuments({ minterAddress: account });
        const totalPages = Math.ceil(totalRecords / limitNumber);

        const paginationInfo = {
            currentPage: pageNumber,
            totalPages,
            totalRecords,
            recordsPerPage: limitNumber,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1,
        };

        return res.status(200).send({
            success: true,
            data: records,
            pagination: paginationInfo,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = fetchAccountRecords;
