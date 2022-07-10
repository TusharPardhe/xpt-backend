const storedAccountList = require("../models/storedAccountList");
const { API_RESPONSE_CODE } = require("../constants/app.constants");

const deleteSavedAccount = async (request, response) => {
    try {
        if (!request.body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const { userName, account } = request.body;
        const schemaFilter = { userName };
        if (!(userName && account)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const userDataFromDB = await storedAccountList.findOne(schemaFilter);

        if (!userDataFromDB) {
            response.status(404).send({
                error: API_RESPONSE_CODE[404],
            });
            return;
        };

        if (userDataFromDB.userName === account) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const savedUserAccountsFromDB = userDataFromDB.accounts;
        delete savedUserAccountsFromDB[account];

        await storedAccountList.updateOne(schemaFilter, {
            userName,
            accounts: savedUserAccountsFromDB,
        });

        response.status(200).send({
            list: userDataFromDB.accounts
        });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };
    return;
}

module.exports = deleteSavedAccount;