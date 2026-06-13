const mongoose = require("mongoose");
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
        },
      },
    ],
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
