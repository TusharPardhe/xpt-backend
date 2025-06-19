/**
 * RevoX Wallet SDK for third-party website integration
 * Compatible with popular XRPL wallets like Xaman
 * Provides easy integration for XRPL wallet connection and transaction signing
 */

class RevoXWalletSDK {
    constructor(config = {}) {
        this.config = {
            apiUrl: config.apiUrl || 'https://suitcoin.ai/xpt',
            websocketUrl: config.websocketUrl || 'https://suitcoin.ai',
            websiteName: config.websiteName || document.title || 'Unknown Website',
            websiteIcon: config.websiteIcon || this.getWebsiteIcon(),
            permissions: config.permissions || ['read_balance', 'read_account_info', 'sign_transactions'],
            timeout: config.timeout || 300000, // 5 minutes default timeout
            ...config,
        };

        this.socket = null;
        this.currentSession = null;
        this.isConnected = false;
        this.eventListeners = {};
        this.connectionPromise = null;

        // Auto-connect WebSocket
        this.initializeWebSocket();
    }

    /**
     * Get website icon automatically
     */
    getWebsiteIcon() {
        // Try to get favicon
        const favicon =
            document.querySelector('link[rel="icon"]') ||
            document.querySelector('link[rel="shortcut icon"]') ||
            document.querySelector('link[rel="apple-touch-icon"]');

        if (favicon) {
            return new URL(favicon.href, window.location.href).href;
        }

        // Default to /favicon.ico
        return new URL('/favicon.ico', window.location.href).href;
    }

    /**
     * Initialize WebSocket connection
     */
    initializeWebSocket() {
        if (typeof io === 'undefined') {
            console.error('Socket.IO client library is required. Please include it before the RevoX SDK.');
            return;
        }

        this.socket = io(`https://suitcoin.ai`, {
            path: '/xpt/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('Connected to RevoX WebSocket');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from RevoX WebSocket');
        });

        this.socket.on('connection:response', (data) => {
            this.handleConnectionResponse(data);
        });

        this.socket.on('transaction:response', (data) => {
            this.handleTransactionResponse(data);
        });

        this.socket.on('session:status', (data) => {
            this.handleSessionStatus(data);
        });

        this.socket.on('error', (error) => {
            this.emit('error', error);
        });
    }

    /**
     * Request connection to RevoX wallet
     * Compatible with Xaman-style connection flow
     * @returns {Promise<{sessionId: string, code: string, expiresIn: number, qrCode?: string}>}
     */
    async requestConnection() {
        try {
            // Clear any existing connection
            this.currentSession = null;
            this.isConnected = false;

            const response = await fetch(`${this.config.apiUrl}/webauth/connect/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    websiteName: this.config.websiteName,
                    websiteOrigin: window.location.origin,
                    websiteIcon: this.config.websiteIcon,
                    permissions: this.config.permissions,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create connection session');
            }

            this.currentSession = {
                sessionId: result.data.sessionId,
                code: result.data.code,
                expiresAt: new Date(result.data.expiresAt),
                status: 'pending',
            };

            // Join session room for real-time updates
            if (this.socket && this.socket.connected) {
                this.socket.emit('website:connect', { sessionId: this.currentSession.sessionId });
            }

            // Create connection promise for awaiting approval
            this.connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection request timed out'));
                }, this.config.timeout);

                this.once('connection_approved', (data) => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    resolve(data);
                });

                this.once('connection_rejected', (data) => {
                    clearTimeout(timeout);
                    reject(new Error(data.reason || 'Connection was rejected by user'));
                });

                this.once('connection_expired', () => {
                    clearTimeout(timeout);
                    reject(new Error('Connection request expired'));
                });
            });

            // Return session data for display
            return {
                sessionId: this.currentSession.sessionId,
                code: this.currentSession.code,
                expiresIn: result.data.expiresIn,
                qrCode: this.generateQRCodeData(this.currentSession.code),
                // Xaman-compatible fields
                uuid: this.currentSession.sessionId,
                next: {
                    always: window.location.href,
                },
                refs: {
                    qr_png: this.generateQRCodeURL(this.currentSession.code),
                    qr_matrix: this.generateQRCodeData(this.currentSession.code),
                    qr_uri_quality_opts: ['m', 'q', 'h'],
                    websocket_status: this.socket?.connected ? 'connected' : 'disconnected',
                },
            };
        } catch (error) {
            this.emit('error', { type: 'connection_failed', error: error.message });
            throw error;
        }
    }

    /**
     * Wait for connection approval
     * @returns {Promise<{walletAddress: string, approved: boolean}>}
     */
    async waitForApproval() {
        if (!this.connectionPromise) {
            throw new Error('No connection request in progress');
        }
        return this.connectionPromise;
    }

    /**
     * Generate QR code data for mobile scanning
     */
    generateQRCodeData(code) {
        return JSON.stringify({
            code: code,
            websiteName: this.config.websiteName,
            websiteOrigin: window.location.origin,
            websiteIcon: this.config.websiteIcon,
            permissions: this.config.permissions,
            type: 'revox_connection',
        });
    }

    /**
     * Generate QR code URL (placeholder - implement with actual QR service)
     */
    generateQRCodeURL(code) {
        const qrData = encodeURIComponent(this.generateQRCodeData(code));
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
    }

    /**
     * Check connection status
     * @returns {Promise<{connected: boolean, walletAddress?: string}>}
     */
    async checkConnection() {
        if (!this.currentSession) {
            return { connected: false };
        }

        try {
            this.socket.emit('session:status', { sessionId: this.currentSession.sessionId });

            // Return current known status immediately
            return {
                connected: this.isConnected,
                walletAddress: this.currentSession.walletAddress,
            };
        } catch (error) {
            this.emit('error', { message: error.message, type: 'status_check_failed' });
            return { connected: false };
        }
    }

    /**
     * Send a payment transaction request
     * @param {Object} paymentData - Payment transaction data
     * @returns {Promise<{requestId: string, expiresIn: number}>}
     */
    async sendPayment(paymentData) {
        return this.sendTransaction('payment', {
            destination: paymentData.destination,
            amount: paymentData.amount,
            destinationTag: paymentData.destinationTag,
            memo: paymentData.memo,
        });
    }

    /**
     * Send a trust set transaction request
     * @param {Object} trustData - Trust set transaction data
     * @returns {Promise<{requestId: string, expiresIn: number}>}
     */
    async setTrustLine(trustData) {
        return this.sendTransaction('trust_set', {
            currency: trustData.currency,
            issuer: trustData.issuer,
            limit: trustData.limit,
        });
    }

    /**
     * Send a generic transaction request
     * @param {string} transactionType - Type of transaction
     * @param {Object} transactionData - Transaction data
     * @param {number} expirationMinutes - Expiration time in minutes
     * @returns {Promise<{requestId: string, expiresIn: number}>}
     */
    async sendTransaction(transactionType, transactionData, expirationMinutes = 2) {
        if (!this.isConnected || !this.currentSession) {
            throw new Error('Wallet not connected. Please connect first.');
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/webauth/transaction/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.currentSession.sessionId,
                    transactionType,
                    transactionData,
                    expirationMinutes,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create transaction request');
            }

            this.emit('transaction:created', {
                requestId: result.data.requestId,
                transactionType,
                expiresIn: result.data.expiresIn,
            });

            return result.data;
        } catch (error) {
            this.emit('error', { message: error.message, type: 'transaction_failed' });
            throw error;
        }
    }

    /**
     * Disconnect from wallet
     */
    disconnect() {
        this.isConnected = false;
        this.currentSession = null;
        this.emit('disconnected');
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Add one-time event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    once(event, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter((cb) => cb !== callback);
        }
    }

    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach((callback) => callback(data));
        }
    }

    /**
     * Handle connection response from WebSocket
     */
    handleConnectionResponse(data) {
        if (data.sessionId === this.currentSession?.sessionId) {
            if (data.approved) {
                this.isConnected = true;
                this.currentSession.status = 'approved';
                this.currentSession.walletAddress = data.walletAddress;

                this.emit('connected', {
                    walletAddress: data.walletAddress,
                    timestamp: data.timestamp,
                });

                // Resolve the connection promise
                this.emit('connection_approved', {
                    walletAddress: data.walletAddress,
                    approved: true,
                });
            } else {
                this.emit('connection_rejected', {
                    reason: 'User rejected the connection',
                    timestamp: data.timestamp,
                });
            }
        }
    }

    /**
     * Handle transaction response from WebSocket
     */
    handleTransactionResponse(data) {
        if (data.approved) {
            this.emit('transaction:approved', {
                requestId: data.requestId,
                transactionHash: data.transactionHash,
                timestamp: data.timestamp,
            });
        } else {
            this.emit('transaction:rejected', {
                requestId: data.requestId,
                error: data.error,
                timestamp: data.timestamp,
            });
        }
    }

    /**
     * Handle session status updates
     */
    handleSessionStatus(data) {
        if (this.currentSession && data.sessionId === this.currentSession.sessionId) {
            this.currentSession.status = data.status;

            if (data.status === 'approved' && data.walletAddress) {
                this.isConnected = true;
                this.currentSession.walletAddress = data.walletAddress;

                this.emit('connected', {
                    walletAddress: data.walletAddress,
                });
            } else if (data.status === 'expired') {
                this.emit('connection:expired');
            }
        }
    }

    /**
     * Get current connection info
     */
    getConnectionInfo() {
        return {
            isConnected: this.isConnected,
            session: this.currentSession,
            walletAddress: this.currentSession?.walletAddress,
        };
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RevoXWalletSDK;
} else if (typeof window !== 'undefined') {
    window.RevoXWalletSDK = RevoXWalletSDK;
}
