const UserSchema = require("../models/UserSchema");
const storedAccountList = require("../models/storedAccountList");
const { API_RESPONSE_CODE } = require("../constants/app.constants");

const saveAccountsList = async (request, response) => {
    try {
        if (!request.body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const { userName, accounts } = request.body;

        if (!(userName && accounts)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        };

        const isAUser = await UserSchema.findOne({ userName });

        if (!isAUser) {
            response.status(404).send({
                error: API_RESPONSE_CODE[404],
            });
            return;
        };

        // max limit 15 for each user account for now.
        const { accounts: userSavedAccountsInDB } = isAUser;
        if (userSavedAccountsInDB && userSavedAccountsInDB.length === 15) {
            response.status(507).send({
                error: API_RESPONSE_CODE[507],
            });
            return;
        };

        // check if account is already present
        if (userSavedAccountsInDB && Object.keys(userSavedAccountsInDB).length > 0) {
            const [accountToSaveFromRequest, accountNameFromRequest] = Object.entries(accounts)[0];

            if (userSavedAccountsInDB[accountToSaveFromRequest]) {
                response.status(409).send({
                    error: "Account address already exists",
                });
                return;
            };

            if (Object.values(userSavedAccountsInDB).includes(accountNameFromRequest)) {
                response.status(409).send({
                    error: "Account name already exists. Please choose some other name.",
                });
                return;
            };
        };

        const updatedList = { ...accounts, ...userSavedAccountsInDB };
        const list = new storedAccountList({ userName, accounts: updatedList });
        await list.save();
        response.status(200).send({ success: API_RESPONSE_CODE[200] });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };
    return;
}

module.exports = saveAccountsList;