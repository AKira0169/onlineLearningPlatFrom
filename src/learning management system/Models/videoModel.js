const mongoose = require("mongoose");
const videoSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    analytics: {
      watchTime: Number,
      completionRate: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
