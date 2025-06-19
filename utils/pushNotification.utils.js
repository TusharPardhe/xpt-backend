const UserSchema = require('../models/UserSchema');

/**
 * Send push notification to user's devices
 */
const sendPushNotification = async (address, notification) => {
    try {
        const user = await UserSchema.findOne({ address });
        if (!user || !user.pushTokens || user.pushTokens.length === 0) {
            console.log(`No push tokens found for user: ${address}`);
            return;
        }

        // For now, we'll just log the notification
        // In a production environment, you would use a service like FCM or APNs
        console.log(`Sending push notification to ${user.pushTokens.length} devices for user ${address}:`, notification);

        // Here you would implement actual push notification sending
        // Example with FCM:
        /*
        const admin = require('firebase-admin');
        
        for (const tokenData of user.pushTokens) {
            try {
                const message = {
                    notification: {
                        title: notification.title,
                        body: notification.body
                    },
                    data: notification.data || {},
                    token: tokenData.token
                };
                
                const response = await admin.messaging().send(message);
                console.log('Push notification sent successfully:', response);
            } catch (error) {
                console.error('Failed to send push notification:', error);
                // Optionally remove invalid tokens
                if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
                    // Remove invalid token
                    user.pushTokens = user.pushTokens.filter(token => token.token !== tokenData.token);
                    await user.save();
                }
            }
        }
        */
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

module.exports = {
    sendPushNotificationToUser: sendPushNotification,
};
