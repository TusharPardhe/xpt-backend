const { API_RESPONSE_CODE } = require('../../constants/app.constants');
const Record = require('../../models/Record');

const saveNewRecord = async (req, res) => {
    try {
        const { minterAddress, patientID, name, txID } = req.body;

        if (!minterAddress || !patientID || !name || !txID) {
            return res.status(400).send({ error: API_RESPONSE_CODE[400] });
        }

        // Check if the record already exists
        const existingRecord = await Record.findOne({ minterAddress, patientID, name });

        if (existingRecord) {
            return res.status(409).send({ error: API_RESPONSE_CODE[409] });
        }

        // Save the new record to the database
        const newRecord = await Record.create({
            minterAddress,
            patientID,
            name,
            txID,
        });

        return res.status(200).send(newRecord);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
};

module.exports = saveNewRecord;
