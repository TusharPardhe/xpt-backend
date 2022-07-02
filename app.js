"use strict";
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const register = require("./routes/register");
const login = require("./routes/login");
const airdrop = require("./routes/airdrop");
const user = require("./routes/user");

dotenv.config();
app.use(cors());

// MongoDB Connection
mongoose.connect(`mongodb+srv://tusharpardhe:${process.env.DB_PASSWORD}@database-cluster.vkwebsu.mongodb.net/?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected to DB successfully");
});

// Middleware to convert request to json
app.use(express.json());

// Routes
app.use("/register", register);
app.use("/login", login);
app.use("/airdrop", airdrop);
app.use("/user", user);

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started successfully..."));
