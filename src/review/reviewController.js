const Review = require('./reviewModel');
const AppError = require('../../utils/appError');
const expressAsyncHandler = require('express-async-handler');

exports.createReview = expressAsyncHandler(async (req, res, next) => {
  const { rating, comment, courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }
  const review = new Review({
    rating,
    comment,
    user: req.user._id,
    course: courseId,
  });
  await review.save();
  res.status(201).json(review);
});

exports.getReviews = expressAsyncHandler(async (req, res, next) => {
  const reviews = await Review.find();
  if (!reviews || reviews.length === 0) {
    return next(new AppError('No reviews found', 404));
  }
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.deleteReview = expressAsyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) {
    return next(new AppError(`Review not found with id: ${req.params.id}`, 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
