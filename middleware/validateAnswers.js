
const AppError = require('../utils/appError');

const validateAnswers = (req, res, next) => {
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.some(ans => !ans.questionId || !ans.selectedOption)) {
    return next(new AppError('Invalid answers format', 400));
  }
  next();
};

module.exports = validateAnswers;
