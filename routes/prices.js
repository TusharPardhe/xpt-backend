const express = require('express');
const { fetchCryptoPrices, fetchTokenPrice, fetchMultiplePrices } = require('../controllers/fetch/fetchCryptoPrices');

const router = express.Router();

// GET /api/prices/crypto - Get cryptocurrency price
router.get('/crypto', fetchCryptoPrices);

// GET /api/prices/token - Get XRPL token price
router.get('/token', fetchTokenPrice);

// GET /api/prices/multiple - Get multiple cryptocurrency prices
router.get('/multiple', fetchMultiplePrices);

module.exports = router;
