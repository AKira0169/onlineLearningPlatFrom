
const AppError = require('../utils/appError');
const Quiz = require('../src/quiz/quizModel');

const processAnswers = async (req, res, next) => {
  const { answers } = req.body;
  const { quizId } = req.params;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  req.quiz = quiz;
  next();
};

module.exports = processAnswers;
