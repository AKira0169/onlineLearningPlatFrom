const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    disucssion:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Disuccsion"
    },
    duration: {
      type: Number,
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true, // To specify the order of modules
    },
    lessons: [lessonSchema],
  },
  {
    timestamps: true,
  },
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    modules: [moduleSchema],
    categories: {
      type: [String],
    },
    tags: {
      type: [String],
    },
    price: {
      type: Number,
      required: true,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
