const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
    },
    fristName: {
      type: String,
      required: [true, 'Please provide a first name'],
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false, // Exclude from queries by default
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password; // `this` refers to the current document
        },
        message: 'Passwords are not the same!',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // Remove passwordConfirm from document

  next();
});

// Middleware to set passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') && !this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Method to check if passwords match
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
