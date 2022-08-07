const UserSchema = require("../models/UserSchema");
const storedAccountList = require("../models/storedAccountList");

const { API_RESPONSE_CODE, MAX_SAVE_ACCOUNT_LIMIT, USER_TYPE } = require("../constants/app.constants");

const saveAccountsList = async (request, response) => {
    try {
        if (!request.body) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const { userName, accounts } = request.body;

        if (!(userName && accounts)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const isAUser = await UserSchema.findOne({ userName });

        if (!isAUser) {
            response.status(404).send({
                error: API_RESPONSE_CODE[404],
            });
            return;
        }

        // max limit is 10 for a users of type = "USER".
        const hasSavedAccounts = await storedAccountList.findOne({ userName });

        if (hasSavedAccounts) {
            const { accounts: userSavedAccountsInDB } = hasSavedAccounts;

            if (isAUser.type === USER_TYPE.USER && Object.keys(userSavedAccountsInDB).length === MAX_SAVE_ACCOUNT_LIMIT) {
                response.status(507).send({
                    error: API_RESPONSE_CODE[507],
                });
                return;
            }

            // check if account is already present
            if (Object.keys(userSavedAccountsInDB).length > 0) {
                const [accountToSaveFromRequest, accountNameFromRequest] = Object.entries(accounts)[0];

                if (userSavedAccountsInDB[accountToSaveFromRequest]) {
                    response.status(409).send({
                        error: "Account address already exists",
                    });
                    return;
                }

                if (Object.values(userSavedAccountsInDB).includes(accountNameFromRequest)) {
                    response.status(409).send({
                        error: "Account name already exists. Please choose some other name.",
                    });
                    return;
                }
            }
            const updatedList = { ...accounts, ...userSavedAccountsInDB };
            await storedAccountList.updateOne(
                { userName },
                {
                    userName,
                    accounts: updatedList,
                }
            );
        } else {
            const list = new storedAccountList({ userName, accounts });
            await list.save();
        }
        response.status(200).send({ success: API_RESPONSE_CODE[200] });
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = saveAccountsList;