const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const { errorHandler, notFound } = require('./middleware/errorHandler'); // Adjust path as needed

// Middleware
app.use(express.json());
app.use(cookieParser());

// Define routes
const usersRoutes = require('./routes/usersRoutes');
app.use('/api/v1/users', usersRoutes);

// Middleware for handling 404 errors
app.use(notFound);

// Global error handling middleware
app.use(errorHandler);

module.exports = app;
