"use strict";
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const register = require("./routes/register");
const login = require("./routes/login");
const test = require("./routes/test");

dotenv.config();
app.use(cors());

// DB CONFIG
mongoose.connect(`mongodb+srv://tusharpardhe:${process.env.DB_PASSWORD}@database-cluster.vkwebsu.mongodb.net/?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected to DB successfully");
});

// MIDDLEWARES
app.use(express.json());

// ROUTES
app.use("/register", register);
app.use("/login", login);
app.use("/test", test);

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started successfully..."));
