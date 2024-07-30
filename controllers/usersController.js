const User = require("../models/usersModel");
const expressAsyncHandler = require('express-async-handler');
const { notFound } = require('../middleware/errorHandler');
const mongoose=require('mongoose')


exports.getAllUsers = expressAsyncHandler(async (req, res) => {
    const users = await User.find();
    if (!users || users.length === 0) {
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

 
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid user ID format: ${id}`);
    error.statusCode = 404; 
    return next(error); r
  }

  const user = await User.findById(id);

  if (!user) {
    const error = new Error(`User not found with id: ${id}`);
    error.statusCode = 404; 
    return next(error);
  }


  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});


exports.updateUser = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  try {
  
    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

  
    if (!user) {
      const error = new Error(`User not found with id: ${id}`);
      error.statusCode = 404; 
      return next(error); 
    }
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
 
    if (err.kind === 'ObjectId') {
      err.statusCode = 404; 
    }
    next(err); 
  }
});

// Delete User
exports.deleteUser = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new Error(`No user found with that ID: ${req.params.id}`));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});


