const Course = require('../courses/courseModel');
const Discussion = require('./discussionModel'); 
const AppError = require('../../utils/appError');
const expressAsyncHandler = require('express-async-handler');
const mongoose=require("mongoose")


exports.createDiscussion = expressAsyncHandler(async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { title, content } = req.body;

    // Create a new discussion
    const discussion = await Discussion.create({
      belong: req.user._id, // Ensure req.user is set up by auth middleware
      title,
      content,
    });

    // Find the course that contains the lesson
    const course = await Course.findOne({
      'modules.lessons._id': lessonId,
    });

    if (!course) {
      return next(new AppError('Course or Lesson not found', 404));
    }

    // Find the lesson
    const lesson = course.modules
      .flatMap(module => module.lessons)
      .find(lesson => lesson._id.toString() === lessonId);

    if (!lesson) {
      return next(new AppError('Lesson not found within the course', 404));
    }

    // Add the discussion ID to the lesson's discussions array
    lesson.disucssion.push(discussion._id); // Use `disucssion` or `discussion`

    // Save the updated course
    await course.save();

    res.status(201).json({
      status: 'success',
      data: discussion,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});


exports.deleteDiscussion = expressAsyncHandler(async (req, res, next) => {
  try {
    const { discussionId } = req.params;

    // Find the discussion to be deleted
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    // Remove the discussion from all lessons and courses
    await Course.updateMany(
      { 'modules.lessons.disucssion': discussionId },
      { $pull: { 'modules.$[].lessons.$[lesson].disucssion': discussionId } },
      { arrayFilters: [{ 'lesson.disucssion': discussionId }] }
    );

    // Delete the discussion
    await Discussion.findByIdAndDelete(discussionId);

    res.status(204).json({
      status: 'success',
      message: 'Discussion deleted successfully',
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});




exports.getAllDiscussions = expressAsyncHandler(async (req, res, next) => {
  try {
    // Fetch all discussions and populate the necessary fields
    const discussions = await Discussion.find()
      .populate({
        path: 'belong', // Populate the 'belong' field with User details
        select: 'username', // Include the username of the user who created the discussion
      })
      .populate({
        path: 'replies.user', // Populate the user field within each reply
        select: 'username', // Include the username of the user who replied
      });

    res.status(200).json({
      status: 'success',
      results: discussions.length,
      data: discussions.map(discussion => ({
        _id: discussion._id,
        title: discussion.title,
        content: discussion.content,
        belong: {
          _id: discussion.belong._id,
          username: discussion.belong.username,
        },
        replies: discussion.replies.map(reply => ({
          _id: reply._id,
          content: reply.content,
          createdAt: reply.createdAt,
          user: {
            _id: reply.user._id,
            username: reply.user.username,
          },
        })),
        likes: discussion.likes,
        likedBy: discussion.likedBy, // You can also populate likedBy if needed
      })),
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});




// Get discussions for a specific lesson
exports.getDiscussionsForLesson = expressAsyncHandler(async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    // Validate the lesson ID format
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return next(new AppError('Invalid lesson ID format', 400));
    }

    // Find the course that contains the lesson
    const course = await Course.findOne({
      'modules.lessons._id': lessonId,
    }).populate({
      path: 'modules.lessons.disucssion',
      select: 'title content replies likes likedBy createdAt updatedAt',
    });

    if (!course) {
      return next(new AppError('Course or Lesson not found', 404));
    }

    // Find the lesson
    const lesson = course.modules
      .flatMap(module => module.lessons)
      .find(lesson => lesson._id.toString() === lessonId);

    if (!lesson) {
      return next(new AppError('Lesson not found within the course', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        discussions: lesson.disucssion,
      },
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});

// Add a reply to a discussion
exports.addReplyToDiscussion = expressAsyncHandler(async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;

    // Find the discussion
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    // Add the reply
    discussion.replies.push({
      user: req.user._id, // Ensure req.user is set up by auth middleware
      content,
    });

    // Save the updated discussion
    await discussion.save();

    res.status(201).json({
      status: 'success',
      data: discussion,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});
// Like a discussion
exports.likeOrUnlikeDiscussion = expressAsyncHandler(async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user._id; // Ensure req.user is set up by auth middleware

    // Find the discussion
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    // Check if the user has already liked the discussion
    const userIndex = discussion.likedBy.indexOf(userId);

    if (userIndex > -1) {
      // User has liked the discussion before, so remove the like
      discussion.likedBy.splice(userIndex, 1);
      discussion.likes -= 1;
    } else {
      // User has not liked the discussion, so add the like
      discussion.likedBy.push(userId);
      discussion.likes += 1;
    }

    // Save the updated discussion
    await discussion.save();

    res.status(200).json({
      status: 'success',
      data: discussion,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});