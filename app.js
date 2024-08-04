const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorHandler'); // Adjust the path to your global error handler
// Middleware

app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

// Define routes
const usersRoutes = require('./src/users/usersRoutes');
const courseRoutes = require('./src/courses/courseRoutes');
const paymentRoutes = require('./src/payment/paymentRoutes');

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payment', paymentRoutes);
// Global error handling middleware

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
