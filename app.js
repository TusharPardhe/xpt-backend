'use strict';
const express = require('express');
const app = express();
var dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

const register = require('./routes/register');
const login = require('./routes/login');
const airdrop = require('./routes/airdrop');
const user = require('./routes/user');
const xrplData = require('./routes/xrplData');

dotenv.config();
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function () {
    console.log('Connected to DB successfully');
});

// Middleware to convert request to json
app.use(express.json());

// Routes
app.use('/register', register);
app.use('/login', login);
app.use('/airdrop', airdrop);
app.use('/user', user);
app.use('/xrpl', xrplData);

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started successfully on ${PORT}`));
