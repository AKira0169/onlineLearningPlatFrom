const express = require("express");
const app = express();
const cookies = require("cookie-parser");

app.use(express.json());

app.use(cookies());

const usersRoutes = require("./routes/usersRoutes");

app.use("/api/v1/users", usersRoutes);

module.exports = app;
