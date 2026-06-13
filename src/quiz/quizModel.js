const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
        },
        correctAnswer: {
          type: String,
          required: true,
          select: false,
        },
      },
    ],
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
