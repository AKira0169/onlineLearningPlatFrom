const mongoose = require("mongoose");
const gamificationSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    badges: [String],
    leaderboardPosition: Number,
    points: Number,
    achievements: [String],
  },
  {
    timestamps: true,
  }
);

const Gamification = mongoose.model("Gamification", gamificationSchema);

module.exports = Gamification;
