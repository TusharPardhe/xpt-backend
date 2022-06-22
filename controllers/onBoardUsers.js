const { Client } = require("xrpl");
const dotenv = require("dotenv");

const UserSchema = require("../models/UserSchema");
const { ERROR_CODES } = require("../constants/app.constants");

dotenv.config();

const onBoardUsers = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send({ error: ERROR_CODES[400] });
            return;
        }

        const { userName, address, password } = body;
        // Validate request
        if (!(userName && address && password)) {
            response.status(400).send({ error: ERROR_CODES[400] });
            return;
        }

        // verify XRPL Address
        const client = new Client(process.env.XRPL_SERVER);
        await client.connect();

        const errorneousAccount = await client
            .request({
                command: "account_info",
                account: address,
            })
            .catch((err) => {
                return err.data.error_message;
            });

        if (errorneousAccount) {
            response.status(400).send({ error: errorneousAccount });
            return;
        }

        const doestUsernameExist = await UserSchema.findOne({ userName });
        const doestAddressExist = await UserSchema.findOne({ address });

        if (doestUsernameExist) {
            response.status(409).send({ error: "Username already exists." });
            return;
        }

        if (doestAddressExist) {
            response.status(409).send({ error: "XRPL address already exists." });
            return;
        }

        const User = new UserSchema({ userName, address, password });
        await User.save();
        response.status(200).send({ success: ERROR_CODES[200] });
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: ERROR_CODES[500] });
    }
    return;
};

module.exports = onBoardUsers;
