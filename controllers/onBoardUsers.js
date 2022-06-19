const UserSchema = require("../models/UserSchema");

const onBoardUsers = async (request, response) => {
    try {
        const { body } = request;

        if (!body) {
            response.status(400).send({ error: `Bad request. Missing request body.` });
            return;
        }

        const { userName, address, password } = body;

        // Validate request
        if (!(userName && address && password)) {
            response.status(400).send({ error: "Bad request. Please check request" });
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
        response.status(200).send({ success: "Data saved successfully" });
    } catch (err) {
        console.log(err);
        response.status(400).send(err);
    }
    return;
};

module.exports = onBoardUsers;
