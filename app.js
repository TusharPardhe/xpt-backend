"use strict";
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const register = require("./routes/register");
const login = require("./routes/login");

dotenv.config();
app.use(cors());

// DB CONFIG
mongoose.connect(`mongodb+srv://tushar:${process.env.DB_PASSWORD}@cluster0.wf2n8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`, {
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

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started successfully..."));
