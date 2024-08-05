const mongoose = require('mongoose');
const { Schema } = mongoose;

const discussionSchema = new Schema(
  {
    referenceType: {
      type: String,
      enum: ['Course', 'Lesson'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'referenceType', // This uses the value of `referenceType` to determine which model to reference
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
