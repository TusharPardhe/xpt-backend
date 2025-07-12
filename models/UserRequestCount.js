const mongoose = require('mongoose');

const userRequestCountSchema = new mongoose.Schema(
    {
        address: {
            type: String,
            required: true,
            unique: true,
        },
        dailyRequests: {
            type: Number,
            default: 0,
        },
        lastRequestDate: {
            type: Date,
            default: Date.now,
        },
        maxDailyRequests: {
            type: Number,
            default: 50, // Default daily limit
        },
    },
    {
        timestamps: true,
    }
);

// Reset counter if it's a new day
userRequestCountSchema.methods.checkAndResetDailyCounter = function () {
    const today = new Date();
    const lastRequest = new Date(this.lastRequestDate);

    // Check if it's a new day
    if (today.toDateString() !== lastRequest.toDateString()) {
        this.dailyRequests = 0;
        this.lastRequestDate = today;
    }

    return this;
};

// Increment request count
userRequestCountSchema.methods.incrementRequestCount = function () {
    this.checkAndResetDailyCounter();
    this.dailyRequests += 1;
    this.lastRequestDate = new Date();
    return this.save();
};

// Check if user has exceeded daily limit
userRequestCountSchema.methods.hasExceededLimit = function () {
    this.checkAndResetDailyCounter();
    return this.dailyRequests >= this.maxDailyRequests;
};

// Get remaining requests
userRequestCountSchema.methods.getRemainingRequests = function () {
    this.checkAndResetDailyCounter();
    return Math.max(0, this.maxDailyRequests - this.dailyRequests);
};

module.exports = mongoose.model('UserRequestCount', userRequestCountSchema);
