const express = require('express');
const router = express.Router();
const traceStudentController = require('./traceStudentController');
const authController = require('../../middleware/authController');

router.use(authController.protect);

router.post('/createTraceStudent/:quizId', traceStudentController.submitAnswers);

module.exports = router;
