'use strict';
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
var dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

const register = require('./routes/register');
const login = require('./routes/login');
const airdrop = require('./routes/airdrop');
const user = require('./routes/user');
const xrplData = require('./routes/xrplData');
const webAuth = require('./routes/webAuth');

// Setup Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8100'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    connectTimeout: 45000,
    maxHttpBufferSize: 1e8,
    allowEIO3: true,
    cookie: false,
});

// Setup AI WebSocket handler
const setupAIWebSocket = require('./websocket/aiWebSocket');
setupAIWebSocket(io);

// Setup Web Authentication WebSocket handler
const { setupWebAuthSocket } = require('./websocket/webAuthSocket');
setupWebAuthSocket(io);

dotenv.config();
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Increase timeout
    socketTimeoutMS: 45000,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function () {
    console.log('Connected to DB successfully');
});

// Middleware to convert request to json
app.use(express.json());

// Serve static files from SDK directory
app.use('/sdk', express.static('sdk'));

// Setup database cleanup service
const { runFullCleanup, markExpiredRecords } = require('./utils/cleanup.utils');

// Routes
app.use('/register', register);
app.use('/login', login);
app.use('/airdrop', airdrop);
app.use('/user', user);
app.use('/xrpl', xrplData);
app.use('/webauth', webAuth);

// Port
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server started successfully on ${PORT}`);

    // Start cleanup services
    console.log('Starting database cleanup services...');

    // Mark expired records every 1 minute
    setInterval(markExpiredRecords, 60 * 1000);

    // Full cleanup every 1 hour
    setInterval(runFullCleanup, 60 * 60 * 1000);

    // Run initial cleanup after 30 seconds
    setTimeout(runFullCleanup, 30 * 1000);
});
