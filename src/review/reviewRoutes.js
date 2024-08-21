const express = require('express');
const router = express.Router();
const reviewController = require('./reviewController');

router
  .route('/')
  .get(reviewController.getReviews)
  .post(reviewController.createReview)
  .delete(reviewController.deleteReview);

module.exports = router;
