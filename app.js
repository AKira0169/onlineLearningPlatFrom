const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./utils/errorHandler"); // Adjust the path to your global error handler
// Middleware

app.use(express.json());
app.use(cookieParser());

// Define routes
const usersRoutes = require("./src/users/usersRoutes");

app.use("/api/v1/users", usersRoutes);

// Global error handling middleware

app.use(globalErrorHandler);

module.exports = app;
