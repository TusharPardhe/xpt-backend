const UserSchema = require('../../models/UserSchema');

/**
 * Update push notification token for a user
 */
const updatePushToken = async (req, res) => {
    try {
        const { address, pushToken, deviceId } = req.body;

        if (!address || !pushToken) {
            return res.status(400).json({
                error: 'Address and push token are required',
            });
        }

        // Find user by address
        let user = await UserSchema.findOne({ address });

        if (!user) {
            // Create user if doesn't exist
            user = new UserSchema({
                address,
                pushTokens: [
                    {
                        token: pushToken,
                        deviceId: deviceId || 'unknown',
                        createdAt: new Date(),
                    },
                ],
            });
        } else {
            // Update or add push token
            const existingTokenIndex = user.pushTokens.findIndex((token) => token.deviceId === deviceId);

            if (existingTokenIndex !== -1) {
                // Update existing token
                user.pushTokens[existingTokenIndex].token = pushToken;
                user.pushTokens[existingTokenIndex].updatedAt = new Date();
            } else {
                // Add new token
                user.pushTokens.push({
                    token: pushToken,
                    deviceId: deviceId || 'unknown',
                    createdAt: new Date(),
                });
            }
        }

        await user.save();

        res.json({
            success: true,
            data: {
                message: 'Push token updated successfully',
            },
        });
    } catch (error) {
        console.error('Update push token error:', error);
        res.status(500).json({
            error: 'Failed to update push token',
        });
    }
};

module.exports = updatePushToken;
