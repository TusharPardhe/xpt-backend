const UserRequestCount = require('../models/UserRequestCount');

const checkRateLimit = async (req, res, next) => {
    try {
        const address = req.body.address || req.query.address || req.headers['x-wallet-address'];

        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required for rate limiting',
            });
        }

        // Find or create user request count record
        let userRequestCount = await UserRequestCount.findOne({ address });

        if (!userRequestCount) {
            userRequestCount = new UserRequestCount({ address });
            await userRequestCount.save();
        }

        // Check if user has exceeded daily limit
        if (userRequestCount.hasExceededLimit()) {
            return res.status(429).json({
                success: false,
                error: 'Daily request limit exceeded',
                maxDailyRequests: userRequestCount.maxDailyRequests,
                remainingRequests: 0,
                resetTime: new Date(new Date().setHours(24, 0, 0, 0)), // Next midnight
            });
        }

        // Increment request count
        await userRequestCount.incrementRequestCount();

        // Add request info to response headers
        res.setHeader('X-RateLimit-Limit', userRequestCount.maxDailyRequests);
        res.setHeader('X-RateLimit-Remaining', userRequestCount.getRemainingRequests());
        res.setHeader('X-RateLimit-Reset', new Date(new Date().setHours(24, 0, 0, 0)).getTime());

        // Add request count info to request object for use in routes
        req.requestInfo = {
            remainingRequests: userRequestCount.getRemainingRequests(),
            maxDailyRequests: userRequestCount.maxDailyRequests,
            dailyRequests: userRequestCount.dailyRequests,
        };

        next();
    } catch (error) {
        console.error('Rate limiting middleware error:', error);
        // Don't block request if rate limiting fails
        req.requestInfo = {
            remainingRequests: 50,
            maxDailyRequests: 50,
            dailyRequests: 0,
        };
        next();
    }
};

const getRemainingRequests = async (req, res) => {
    try {
        const address = req.query.address || req.headers['x-wallet-address'];

        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required',
            });
        }

        let userRequestCount = await UserRequestCount.findOne({ address });

        if (!userRequestCount) {
            userRequestCount = new UserRequestCount({ address });
            await userRequestCount.save();
        }

        userRequestCount.checkAndResetDailyCounter();

        res.json({
            success: true,
            data: {
                remainingRequests: userRequestCount.getRemainingRequests(),
                maxDailyRequests: userRequestCount.maxDailyRequests,
                dailyRequests: userRequestCount.dailyRequests,
                resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
            },
        });
    } catch (error) {
        console.error('Get remaining requests error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get remaining requests',
        });
    }
};

module.exports = {
    checkRateLimit,
    getRemainingRequests,
};
