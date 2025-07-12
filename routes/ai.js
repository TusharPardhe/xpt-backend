const express = require('express');
const { getRemainingRequests } = require('../middlewares/rateLimiting');

const router = express.Router();

// GET /api/ai/rate-limit - Get remaining AI requests for user
router.get('/rate-limit', getRemainingRequests);

module.exports = router;
