const REQUEST_TIMEOUT = 15000; // 15 seconds

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const fetchXRPLTokens = async (req, res) => {
    try {
        const { limit = 50, offset = 0, name_like, sort_by = 'trustlines' } = req.query;

        const XRPL_META_API_BASE = 'https://s1.xrplmeta.org';

        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
            sort_by: sort_by.toString(),
            expand_meta: 'true',
            include_changes: 'false',
        });

        if (name_like && name_like.trim()) {
            params.append('name_like', name_like.trim());
        }

        const apiUrl = `${XRPL_META_API_BASE}/tokens?${params}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'RevoX-Wallet/1.0',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('XRPLMeta API error:', response.status, response.statusText);

            if (response.status === 404) {
                return res.status(404).json({
                    success: false,
                    message: 'Token service not available',
                    tokens: [],
                    count: 0,
                });
            } else if (response.status === 500) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error. Please try again later',
                    tokens: [],
                    count: 0,
                });
            } else {
                return res.status(response.status).json({
                    success: false,
                    message: `API error: ${response.status}`,
                    tokens: [],
                    count: 0,
                });
            }
        }

        const data = await response.json();
        const tokens = data.tokens || [];
        const count = data.count || tokens.length;
        res.json({
            success: true,
            tokens: tokens,
            count: count,
            message: 'Tokens fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching XRPL tokens:', error);

        let errorMessage = 'Failed to fetch tokens';
        let statusCode = 500;

        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
            statusCode = 408;
        } else if (error.message && error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
            statusCode = 503;
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            tokens: [],
            count: 0,
        });
    }
};

module.exports = {
    fetchXRPLTokens,
};
