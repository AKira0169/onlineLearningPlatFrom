const mongoose = require("mongoose");
const { Schema } = mongoose;

const gradebookSchema = new Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    grades: [
      {
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lesson',
        },
        grade: Number,
      },
    ],
    overallPerformance: String,
  },
  {
    timestamps: true,
  }
);

const Gradebook = mongoose.model("Gradebook", gradebookSchema);

module.exports = Gradebook;
