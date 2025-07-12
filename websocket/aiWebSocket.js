const { processAIRequest, parseWalletCommand } = require('./utils/aiUtils');
const UserRequestCount = require('../models/UserRequestCount');

// Function to get USD to target currency conversion rate
const getUSDConversionRate = async (targetCurrency) => {
    try {
        // Using free exchange rate API
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);

        if (!response.ok) {
            console.log('Exchange rate API failed, trying fallback...');
            // Fallback to another free API
            const fallbackResponse = await fetch(`https://api.fxapi.com/v1/latest?base=USD&symbols=${targetCurrency.toUpperCase()}`);

            if (!fallbackResponse.ok) {
                return null;
            }

            const fallbackData = await fallbackResponse.json();
            return fallbackData.rates?.[targetCurrency.toUpperCase()];
        }

        const data = await response.json();
        return data.rates[targetCurrency.toUpperCase()];
    } catch (error) {
        console.error(`Error fetching conversion rate for ${targetCurrency}:`, error);
        return null;
    }
};

const setupAIWebSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected to AI socket: ${socket.id} at ${new Date().toISOString()}`);

        socket.emit('connected', {
            message: 'Connected to AI WebSocket',
            socketId: socket.id,
            timestamp: new Date().toISOString(),
        });

        // Helper function to check and update rate limit
        const checkRateLimit = async (address) => {
            if (!address) {
                return { allowed: false, error: 'Wallet address is required for rate limiting' };
            }

            try {
                let userRequestCount = await UserRequestCount.findOne({ address });

                if (!userRequestCount) {
                    userRequestCount = new UserRequestCount({ address });
                    await userRequestCount.save();
                }

                if (userRequestCount.hasExceededLimit()) {
                    return {
                        allowed: false,
                        error: 'Daily request limit exceeded',
                        maxDailyRequests: userRequestCount.maxDailyRequests,
                        remainingRequests: 0,
                        resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
                        userRequestCount: null,
                    };
                }

                return {
                    allowed: true,
                    remainingRequests: userRequestCount.getRemainingRequests(),
                    maxDailyRequests: userRequestCount.maxDailyRequests,
                    dailyRequests: userRequestCount.dailyRequests,
                    userRequestCount: userRequestCount,
                };
            } catch (error) {
                console.error('Rate limiting error:', error);
                // Allow request if rate limiting fails
                return { allowed: true, remainingRequests: 50, maxDailyRequests: 50, dailyRequests: 0, userRequestCount: null };
            }
        };

        const incrementRequestCount = async (userRequestCount) => {
            if (userRequestCount) {
                try {
                    await userRequestCount.incrementRequestCount();
                    return {
                        remainingRequests: userRequestCount.getRemainingRequests(),
                        maxDailyRequests: userRequestCount.maxDailyRequests,
                        dailyRequests: userRequestCount.dailyRequests,
                    };
                } catch (error) {
                    console.error('Error incrementing request count:', error);
                    return null;
                }
            }
            return null;
        };

        socket.on('ai:message', async (data, callback) => {
            try {
                const { prompt, address } = data;

                if (!prompt) {
                    const errorResponse = { error: 'Invalid request: missing prompt' };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:message:response', errorResponse);
                    }
                    return;
                }

                // Check rate limit
                const rateLimitResult = await checkRateLimit(address);
                if (!rateLimitResult.allowed) {
                    const errorResponse = {
                        error: rateLimitResult.error,
                        rateLimitExceeded: true,
                        ...rateLimitResult,
                    };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:message:response', errorResponse);
                    }
                    return;
                }

                const textResponse = await processAIRequest(prompt);

                // Only increment request count on successful AI response
                const incrementResult = await incrementRequestCount(rateLimitResult.userRequestCount);
                const finalRateLimitData = incrementResult || {
                    remainingRequests: rateLimitResult.remainingRequests,
                    maxDailyRequests: rateLimitResult.maxDailyRequests,
                };

                const response = {
                    message: textResponse,
                    remainingRequests: finalRateLimitData.remainingRequests,
                    maxDailyRequests: finalRateLimitData.maxDailyRequests,
                };

                if (callback) {
                    callback(response);
                } else {
                    socket.emit('ai:message:response', response);
                }
            } catch (error) {
                console.error('Error processing AI message:', error);
                const errorResponse = { error: 'Error processing AI request' };

                if (callback) {
                    callback(errorResponse);
                } else {
                    socket.emit('ai:message:response', errorResponse);
                }
            }
        });

        socket.on('ai:parseCommand', async (data, callback) => {
            try {
                const { message, contacts, address } = data;

                if (!message) {
                    const errorResponse = { error: 'Invalid request: missing message' };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:parseCommand:response', errorResponse);
                    }
                    return;
                }

                // Check rate limit
                const rateLimitResult = await checkRateLimit(address);
                if (!rateLimitResult.allowed) {
                    const errorResponse = {
                        error: rateLimitResult.error,
                        rateLimitExceeded: true,
                        ...rateLimitResult,
                    };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:parseCommand:response', errorResponse);
                    }
                    return;
                }

                const parsedCommand = await parseWalletCommand(message, contacts || []);

                // Only increment request count on successful parsing
                const incrementResult = await incrementRequestCount(rateLimitResult.userRequestCount);
                const finalRateLimitData = incrementResult || {
                    remainingRequests: rateLimitResult.remainingRequests,
                    maxDailyRequests: rateLimitResult.maxDailyRequests,
                };

                const response = {
                    parsedCommand,
                    remainingRequests: finalRateLimitData.remainingRequests,
                    maxDailyRequests: finalRateLimitData.maxDailyRequests,
                };

                if (callback) {
                    callback(response);
                } else {
                    socket.emit('ai:parseCommand:response', response);
                }
            } catch (error) {
                console.error('Error parsing command:', error);
                const errorResponse = { error: 'Error parsing command' };

                if (callback) {
                    callback(errorResponse);
                } else {
                    socket.emit('ai:parseCommand:response', errorResponse);
                }
            }
        });

        // Handle price checking requests
        socket.on('ai:price', async (data, callback) => {
            try {
                const { currency = 'XRP', targetCurrency = 'USD', address } = data;

                if (!currency) {
                    const errorResponse = { error: 'Invalid request: missing currency' };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:price:response', errorResponse);
                    }
                    return;
                }

                // Check rate limit
                const rateLimitResult = await checkRateLimit(address);
                if (!rateLimitResult.allowed) {
                    const errorResponse = {
                        error: rateLimitResult.error,
                        rateLimitExceeded: true,
                        ...rateLimitResult,
                    };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:price:response', errorResponse);
                    }
                    return;
                }

                // For now, let's handle XRP and major cryptos through the internal API
                const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

                const cryptoMap = {
                    XRP: 'ripple',
                    BTC: 'bitcoin',
                    ETH: 'ethereum',
                    ADA: 'cardano',
                    DOT: 'polkadot',
                    LINK: 'chainlink',
                    LTC: 'litecoin',
                    BCH: 'bitcoin-cash',
                    XLM: 'stellar',
                    DOGE: 'dogecoin',
                    UNI: 'uniswap',
                    AAVE: 'aave',
                    SOL: 'solana',
                    MATIC: 'matic-network',
                    AVAX: 'avalanche-2',
                };

                const normalizedCurrency = currency.toUpperCase();
                const normalizedTarget = targetCurrency.toUpperCase();
                const coinId = cryptoMap[normalizedCurrency];

                if (!coinId) {
                    const errorResponse = {
                        error: `Unsupported cryptocurrency: ${normalizedCurrency}`,
                        supportedCurrencies: Object.keys(cryptoMap),
                    };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:price:response', errorResponse);
                    }
                    return;
                }

                // Always fetch price data in USD first for consistency
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch cryptocurrency price');
                }

                const priceData = await response.json();
                const coinData = priceData[coinId];

                if (!coinData) {
                    throw new Error('No price data available');
                }

                const usdPrice = coinData.usd;
                const change24h = coinData.usd_24h_change;
                const lastUpdated = coinData.last_updated_at;

                let finalPrice = usdPrice;

                // If target currency is not USD, convert using our conversion function
                if (normalizedTarget !== 'USD') {
                    const conversionRate = await getUSDConversionRate(normalizedTarget);
                    
                    if (!conversionRate) {
                        throw new Error(`Unable to convert USD to ${normalizedTarget}`);
                    }

                    finalPrice = usdPrice * conversionRate;
                }

                // Only increment request count on successful price fetch
                const incrementResult = await incrementRequestCount(rateLimitResult.userRequestCount);
                const finalRateLimitData = incrementResult || {
                    remainingRequests: rateLimitResult.remainingRequests,
                    maxDailyRequests: rateLimitResult.maxDailyRequests,
                };

                const responseData = {
                    success: true,
                    data: {
                        currency: normalizedCurrency,
                        targetCurrency: normalizedTarget,
                        price: finalPrice,
                        change24h: change24h ? parseFloat(change24h.toFixed(2)) : null,
                        lastUpdated: new Date(lastUpdated * 1000).toISOString(),
                        formattedPrice: `${finalPrice.toLocaleString()} ${normalizedTarget}`,
                        trend: change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'neutral',
                    },
                    remainingRequests: finalRateLimitData.remainingRequests,
                    maxDailyRequests: finalRateLimitData.maxDailyRequests,
                };

                if (callback) {
                    callback(responseData);
                } else {
                    socket.emit('ai:price:response', responseData);
                }
            } catch (error) {
                console.error('Error fetching price:', error);
                const errorResponse = {
                    error: 'Failed to fetch cryptocurrency price',
                    details: error.message,
                };

                if (callback) {
                    callback(errorResponse);
                } else {
                    socket.emit('ai:price:response', errorResponse);
                }
            }
        });

        socket.on('ping', (callback) => {
            console.log(`Ping received from socket ${socket.id} at ${new Date().toISOString()}`);
            const pongData = {
                timestamp: new Date().toISOString(),
                socketId: socket.id,
                status: 'connected',
            };

            if (typeof callback === 'function') {
                callback(pongData);
            } else {
                socket.emit('pong', pongData);
            }
        });

        socket.on('status', (callback) => {
            const statusData = {
                connected: true,
                socketId: socket.id,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            };

            if (typeof callback === 'function') {
                callback(statusData);
            } else {
                socket.emit('status:response', statusData);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`User disconnected from AI socket (${socket.id}), reason: ${reason} at ${new Date().toISOString()}`);
        });
    });

    io.on('connect_error', (error) => {
        console.error('AI Namespace connection error:', error);
    });

    console.log('AI WebSocket handlers set up successfully');
};

module.exports = setupAIWebSocket;
