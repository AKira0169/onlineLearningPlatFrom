const expressAsyncHandler = require('express-async-handler');
const AppError = require('../../utils/appError');
const TraceStudent = require('./traceStudentModel');

const Quiz = require('../quiz/quizModel');

exports.submitAnswers = expressAsyncHandler(async (req, res, next) => {
  const { answers } = req.body;
  const { quizId } = req.params;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }

  const totalQuestions = quiz.questions.length;
  let correctAnswersCount = 0;

  const results = answers.map(answer => {
    const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
    if (question) {
      const isCorrect = question.correctAnswer === answer.selectedOption;
      if (isCorrect) {
        correctAnswersCount++;
        return {
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: true,
        };
      } else {
        return {
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: false,
        };
      }
    }
  });

  const traceStudent = new TraceStudent({
    student: req.user._id,
    quiz: quizId,
    answers: results,
    correctAnswersCount: correctAnswersCount,
    totalQuestions: totalQuestions,
  });

  await traceStudent.save();

  res.status(200).json({
    message: 'Quiz submitted successfully',
    totalQuestions,
    correctAnswersCount,
    results,
    traceStudent,
  });
});
