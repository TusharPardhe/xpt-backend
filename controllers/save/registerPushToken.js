const UserSchema = require('../../models/UserSchema');

const registerPushToken = async (req, res) => {
    try {
        const { token, deviceId, platform } = req.body;
        const { userAddress } = req; // Assuming this comes from JWT middleware

        if (!token || !deviceId || !userAddress) {
            return res.status(400).json({
                error: 'Token, deviceId, and userAddress are required',
            });
        }

        // Find the user
        const user = await UserSchema.findOne({ address: userAddress });
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        // Remove existing token for this device to avoid duplicates
        user.pushTokens = user.pushTokens.filter((pushToken) => pushToken.deviceId !== deviceId);

        // Add new token
        user.pushTokens.push({
            token,
            deviceId,
            platform: platform || 'unknown',
            createdAt: new Date(),
        });

        // Keep only the latest 5 tokens per user (cleanup old devices)
        if (user.pushTokens.length > 5) {
            user.pushTokens = user.pushTokens.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
        }

        await user.save();

        res.json({
            success: true,
            data: {
                message: 'Push token registered successfully',
                tokenCount: user.pushTokens.length,
            },
        });
    } catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({
            error: 'Failed to register push token',
        });
    }
};

module.exports = registerPushToken;
