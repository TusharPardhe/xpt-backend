const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const Record = require('../../models/Record');

const fetchAllRecords = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '', filterField = 'all' } = req.query;

        const pageNumber = Math.max(1, parseInt(page));
        const limitNumber = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNumber - 1) * limitNumber;

        const allowedSortFields = ['createdAt', 'minterAddress', 'patientID', 'name'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const searchQuery = search
            ? filterField === 'all'
                ? {
                      $or: [
                          { minterAddress: { $regex: search, $options: 'i' } },
                          { name: { $regex: search, $options: 'i' } },
                          { patientID: { $regex: search, $options: 'i' } },
                      ],
                  }
                : { [filterField]: { $regex: search, $options: 'i' } }
            : {};

        const records = await Record.find(searchQuery)
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(limitNumber);

        const totalRecords = await Record.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalRecords / limitNumber);

        const paginationInfo = {
            currentPage: pageNumber,
            totalPages,
            totalRecords,
            recordsPerPage: limitNumber,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1,
        };

        const sortInfo = {
            sortBy: sortField,
            sortOrder: sortDirection === 1 ? 'asc' : 'desc',
        };

        return res.status(200).send({
            success: true,
            data: records,
            pagination: paginationInfo,
            sort: sortInfo,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = fetchAllRecords;
