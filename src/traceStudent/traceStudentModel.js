const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentQuizSchema = new Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Quiz.questions',
          required: true,
        },
        selectedOption: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
    correctAnswersCount: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const StudentQuiz = mongoose.model('StudentQuiz', studentQuizSchema);

module.exports = StudentQuiz;
