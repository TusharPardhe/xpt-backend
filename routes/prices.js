const express = require('express');
const { fetchCryptoPrices, fetchTokenPrice, fetchMultiplePrices } = require('../controllers/fetch/fetchCryptoPrices');
const { fetchXRPLTokens } = require('../controllers/fetch/fetchXRPLTokens');

const router = express.Router();

// GET /api/prices/crypto - Get cryptocurrency price
router.get('/crypto', fetchCryptoPrices);

// GET /api/prices/token - Get XRPL token price
router.get('/token', fetchTokenPrice);

// GET /api/prices/multiple - Get multiple cryptocurrency prices
router.get('/multiple', fetchMultiplePrices);

// GET /api/prices/xrpl-tokens - Get XRPL tokens for trustline
router.get('/xrpl-tokens', fetchXRPLTokens);

module.exports = router;
