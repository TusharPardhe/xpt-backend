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
        }

        const list = new storedAccountList({ userName, accounts });
        await list.save();
        response.status(200).send({ success: API_RESPONSE_CODE[200] });

    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    };
    return;
}

module.exports = saveAccountsList;