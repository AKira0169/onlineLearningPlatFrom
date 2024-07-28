const mongoose = require("mongoose");
const validate = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  fristName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validate.isEmail, "Please provide a valid email address"],
  },
  role: {
    type: String,
    enum: ["student", "instructor", "admins"],
    default: "student",
  },
  password: {
    type: String,
    required: true,
  },
  passwordConfirm: {
    type: String,
    required: true,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre("save", function (next) {
  if (!this.isModified("password" || this.isNew)) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctpassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
const User = mongoose.model("User", userSchema);

module.exports = User;
