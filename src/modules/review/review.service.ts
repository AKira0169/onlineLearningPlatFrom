import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppError } from '../../common/errors/app-error';
import { CreateReviewDto } from './dto/review.dto';

/** Port of `src/review/reviewController.js`. The original referenced `Course` without importing it
 *  (a latent crasher) — now injected. The `user`/`course` write fields are kept verbatim. */
@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Rating') private readonly ratingModel: Model<any>,
    @InjectModel('Course') private readonly courseModel: Model<any>,
  ) {}

  async createReview(body: CreateReviewDto, user: any) {
    const { rating, comment, courseId } = body;
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    const review = new this.ratingModel({
      rating,
      comment,
      user: user._id,
      course: courseId,
    });
    await review.save();
    return review;
  }

  async getReviews() {
    const reviews = await this.ratingModel.find().lean();
    if (!reviews || reviews.length === 0) {
      throw new AppError('No reviews found', 404);
    }
    return { status: 'success', results: reviews.length, data: { reviews } };
  }

  async deleteReview(id: string) {
    const review = await this.ratingModel.findByIdAndDelete(id);
    if (!review) {
      throw new AppError(`Review not found with id: ${id}`, 404);
    }
    return { status: 'success', data: null };
  }
}
