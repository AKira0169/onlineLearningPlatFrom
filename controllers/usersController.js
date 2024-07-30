const User = require("../models/usersModel");
const expressAsyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

exports.getAllUsers = expressAsyncHandler(async (req, res) => {
  const users = await User.find();
  if (!users || users.length === 0) {
    return next(new AppError("No users found", 404));
  }
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (user) {
    return next(new AppError(`User not found with id: ${id}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.updateUser = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError(`User not found with id: ${id}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Delete User
exports.deleteUser = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError(`User not found with id: ${req.params.id}`, 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
