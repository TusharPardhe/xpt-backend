const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Client, dropsToXrp } = require('xrpl');
const { API_RESPONSE_CODE } = require('../../constants/app.constants');

/**
 * Fetch current XRP price in various fiat currencies
 */
const fetchXRPPrice = async (targetCurrency = 'USD') => {
    try {
        // Use CoinGecko API for reliable price data
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=${targetCurrency.toLowerCase()}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch XRP price');
        }

        const data = await response.json();
        return data.ripple[targetCurrency.toLowerCase()];
    } catch (error) {
        console.error('Error fetching XRP price:', error);
        throw error;
    }
};

/**
 * Fetch major cryptocurrency prices
 */
const fetchCryptoPrices = async (req, res) => {
    try {
        const { currency = 'XRP', targetCurrency = 'USD' } = req.query;

        // Normalize currency symbols
        const normalizedCurrency = currency.toUpperCase();
        const normalizedTarget = targetCurrency.toUpperCase();

        // Map of supported cryptocurrencies to CoinGecko IDs
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

        const coinId = cryptoMap[normalizedCurrency];

        if (!coinId) {
            return res.status(400).json({
                success: false,
                error: `Unsupported cryptocurrency: ${normalizedCurrency}`,
                supportedCurrencies: Object.keys(cryptoMap),
            });
        }

        // Fetch price data
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${normalizedTarget.toLowerCase()}&include_24hr_change=true&include_last_updated_at=true`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch cryptocurrency price');
        }

        const data = await response.json();
        const coinData = data[coinId];

        if (!coinData) {
            throw new Error('No price data available');
        }

        const price = coinData[normalizedTarget.toLowerCase()];
        const change24h = coinData[`${normalizedTarget.toLowerCase()}_24h_change`];
        const lastUpdated = coinData.last_updated_at;

        res.json({
            success: true,
            data: {
                currency: normalizedCurrency,
                targetCurrency: normalizedTarget,
                price: price,
                change24h: change24h ? parseFloat(change24h.toFixed(2)) : null,
                lastUpdated: new Date(lastUpdated * 1000).toISOString(),
                formattedPrice: `${price.toLocaleString()} ${normalizedTarget}`,
                trend: change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'neutral',
            },
        });
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cryptocurrency prices',
        });
    }
};

/**
 * Fetch token price for user's held tokens
 * This will get token price from XRPL DEX and convert to desired fiat currency
 */
const fetchTokenPrice = async (req, res) => {
    try {
        const { tokenCurrency, tokenIssuer, targetCurrency = 'USD', networkServer } = req.query;

        if (!tokenCurrency || !tokenIssuer) {
            return res.status(400).json({
                success: false,
                error: 'Token currency and issuer are required',
            });
        }

        const xrplServerUrl = networkServer || process.env.XRPL_SERVER;
        const client = new Client(xrplServerUrl, { connectionTimeout: 10000 });
        await client.connect();

        try {
            // Get order book for token/XRP pair
            const orderBook = await client.request({
                command: 'book_offers',
                taker_gets: {
                    currency: tokenCurrency,
                    issuer: tokenIssuer,
                },
                taker_pays: 'XRP',
                limit: 10,
            });

            if (!orderBook.result.offers || orderBook.result.offers.length === 0) {
                await client.disconnect();
                return res.status(404).json({
                    success: false,
                    error: 'No market data available for this token',
                });
            }

            // Calculate average price from top offers
            let totalXRP = 0;
            let totalTokens = 0;

            for (const offer of orderBook.result.offers.slice(0, 5)) {
                const xrpAmount = dropsToXrp(offer.TakerPays);
                const tokenAmount = parseFloat(offer.TakerGets.value);
                totalXRP += xrpAmount;
                totalTokens += tokenAmount;
            }

            const tokenPriceInXRP = totalXRP / totalTokens;

            await client.disconnect();

            // Get current XRP price in target currency
            const xrpPriceInFiat = await fetchXRPPrice(targetCurrency);
            const tokenPriceInFiat = tokenPriceInXRP * xrpPriceInFiat;

            res.json({
                success: true,
                data: {
                    tokenCurrency,
                    tokenIssuer,
                    targetCurrency: targetCurrency.toUpperCase(),
                    priceInXRP: parseFloat(tokenPriceInXRP.toFixed(6)),
                    priceInFiat: parseFloat(tokenPriceInFiat.toFixed(6)),
                    xrpPrice: xrpPriceInFiat,
                    formattedPrice: `${tokenPriceInFiat.toLocaleString()} ${targetCurrency.toUpperCase()}`,
                    lastUpdated: new Date().toISOString(),
                    marketDepth: orderBook.result.offers.length,
                },
            });
        } catch (xrplError) {
            await client.disconnect();
            throw xrplError;
        }
    } catch (error) {
        console.error('Error fetching token price:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch token price',
        });
    }
};

/**
 * Get multiple cryptocurrency prices at once
 */
const fetchMultiplePrices = async (req, res) => {
    try {
        const { currencies = 'XRP,BTC,ETH', targetCurrency = 'USD' } = req.query;
        const currencyList = currencies.split(',').map((c) => c.trim().toUpperCase());

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
        };

        const validCurrencies = currencyList.filter((curr) => cryptoMap[curr]);
        const coinIds = validCurrencies.map((curr) => cryptoMap[curr]).join(',');

        if (validCurrencies.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid cryptocurrencies provided',
                supportedCurrencies: Object.keys(cryptoMap),
            });
        }

        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=${targetCurrency.toLowerCase()}&include_24hr_change=true`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch cryptocurrency prices');
        }

        const data = await response.json();
        const results = {};

        validCurrencies.forEach((currency) => {
            const coinId = cryptoMap[currency];
            const coinData = data[coinId];

            if (coinData) {
                const price = coinData[targetCurrency.toLowerCase()];
                const change24h = coinData[`${targetCurrency.toLowerCase()}_24h_change`];

                results[currency] = {
                    price: price,
                    change24h: change24h ? parseFloat(change24h.toFixed(2)) : null,
                    formattedPrice: `${price.toLocaleString()} ${targetCurrency.toUpperCase()}`,
                    trend: change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'neutral',
                };
            }
        });

        res.json({
            success: true,
            data: {
                prices: results,
                targetCurrency: targetCurrency.toUpperCase(),
                lastUpdated: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error fetching multiple prices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cryptocurrency prices',
        });
    }
};

module.exports = {
    fetchCryptoPrices,
    fetchTokenPrice,
    fetchMultiplePrices,
    fetchXRPPrice,
};
