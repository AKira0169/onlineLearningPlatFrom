const Course = require('../courses/courseModel');
const Quiz = require('../quiz/quizModel');
const expressAsyncHandler = require('express-async-handler');
const AppError = require('../../utils/appError');

exports.createQuiz = expressAsyncHandler(async (req, res, next) => {
  const { courseId, moduleId } = req.params;
  const { title, questions } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  if (moduleId) {
    const moduleExists = course.modules.some(mod => mod._id.toString() === moduleId);
    if (!moduleExists) {
      return next(new AppError('Module not found in the course', 404));
    }
  }

  // Create the quiz
  const quiz = new Quiz({
    title,
    questions,
    course: courseId,
    module: moduleId || null,
  });

  await quiz.save();

  res.status(201).json({ message: 'Quiz created successfully', quiz });
});

exports.getQuizzesForCourse = expressAsyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const quizzes = await Quiz.find({ course: courseId });
  res.status(200).json({ quizzes });
});

exports.getQuizById = expressAsyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  res.status(200).json({ quiz });
});

exports.deleteQuiz = expressAsyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const quiz = await Quiz.findByIdAndDelete(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  res.status(204).json({ message: 'Quiz deleted successfully' });
});

exports.updateQuiz = expressAsyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const { title, questions } = req.body;
  const quiz = await Quiz.findByIdAndUpdate(quizId, { title, questions }, { new: true });
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  res.status(200).json({ message: 'Quiz updated successfully', quiz });
});

exports.getQuizzesForModule = expressAsyncHandler(async (req, res, next) => {
  const { moduleId } = req.params;
  const quizzes = await Quiz.find({ module: moduleId });

  if (!quizzes || quizzes.length === 0) {
    return next(new AppError('No quizzes found for this module', 404));
  }

  res.status(200).json({ quizzes });
});
