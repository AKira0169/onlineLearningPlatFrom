const express = require('express');
const router = express.Router();
const quizController = require('./quizController');
const authController = require('../../middleware/authController');
const authorization = require('../../middleware/authorization');
router.use(authController.protect);
router.use(authorization.restrictTo('admin', 'instructor'));

router.post('/createquiz/:courseId/:moduleId', quizController.createQuiz);
router.get('/getQuizzes/:courseId', quizController.getQuizzesForCourse);
router.get('/getquizbyid/:quizId', quizController.getQuizById);
router.delete('/deletequiz/:quizId', quizController.deleteQuiz);
router.patch('/updatequiz/:quizId', quizController.updateQuiz);
router.get('/getquizformodule/:moduleId', quizController.getQuizzesForModule);

module.exports = router;
