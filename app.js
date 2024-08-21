const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorHandler'); // Adjust the path to your global error handler

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define routes
const usersRoutes = require('./src/users/usersRoutes');
const courseRoutes = require('./src/courses/courseRoutes');
const paymentRoutes = require('./src/payment/paymentRoutes');
const discussionRoutes = require('./src/disuccsion/discussionRoute');
const quizRoutes=require('./src/quiz/quizRoute')
const traceStudent = require('./src/traceStudent/traceStudentRoute');

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/discussion', discussionRoutes);
app.use('/api/v1/quiz',quizRoutes);
app.use('/api/v1/traceStudent', traceStudent);
// Global error handling middleware

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
