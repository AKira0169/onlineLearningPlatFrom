const mongoose = require('mongoose');

const socialInteractionSchema = new Schema(
  {
    course: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    discount: Number,
    couponCode: String,
  },
  {
    timestamps: true,
  },
);

const SocialInteraction = mongoose.model('SocialInteraction', socialInteractionSchema);

module.exports = SocialInteraction;
