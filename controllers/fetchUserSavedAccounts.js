const storedAccountList = require("../models/storedAccountList");
const { API_RESPONSE_CODE } = require("../constants/app.constants");

const fetchUserSavedAccounts = async (request, response) => {

    try {
        if (!request.body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const { userName } = request.body;
        const list = await storedAccountList.findOne({ userName });

        if (!list) {
            response.status(404).send({
                error: API_RESPONSE_CODE[404],
            });
            return;
        }

        response.status(200).send({
            list: list.accounts
        });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };
    return;
};

module.exports = fetchUserSavedAccounts;