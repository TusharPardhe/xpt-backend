const { processAIRequest, parseWalletCommand } = require('./utils/aiUtils');

const setupAIWebSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected to AI socket: ${socket.id} at ${new Date().toISOString()}`);

        socket.emit('connected', {
            message: 'Connected to AI WebSocket',
            socketId: socket.id,
            timestamp: new Date().toISOString(),
        });

        socket.on('ai:message', async (data, callback) => {
            try {
                const { prompt } = data;

                if (!prompt) {
                    const errorResponse = { error: 'Invalid request: missing prompt' };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:message:response', errorResponse);
                    }
                    return;
                }

                const textResponse = await processAIRequest(prompt);
                const response = { message: textResponse };

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
                const { message, contacts } = data;

                if (!message) {
                    const errorResponse = {
                        error: 'Invalid request: missing message',
                        action: 'unknown',
                        confidence: 0.5,
                    };
                    if (callback) {
                        callback(errorResponse);
                    } else {
                        socket.emit('ai:parseCommand:response', errorResponse);
                    }
                    return;
                }

                const parsedCommand = await parseWalletCommand(message, contacts);

                if (callback) {
                    callback(parsedCommand);
                } else {
                    socket.emit('ai:parseCommand:response', parsedCommand);
                }
            } catch (error) {
                console.error('Error processing command parsing:', error);
                const errorResponse = {
                    error: 'Error processing AI request',
                    action: 'unknown',
                    confidence: 0.5,
                };

                if (callback) {
                    callback(errorResponse);
                } else {
                    socket.emit('ai:parseCommand:response', errorResponse);
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

    aiNamespace.on('connect_error', (error) => {
        console.error('AI Namespace connection error:', error);
    });

    console.log('AI WebSocket handlers set up successfully');
};

module.exports = setupAIWebSocket;
