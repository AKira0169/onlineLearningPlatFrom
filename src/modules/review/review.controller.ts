import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/review.dto';

/**
 * Mounted at `review`. The original router had no auth at all, but `createReview` needs `req.user`,
 * so the create route is guarded with JwtAuthGuard (the only change). GET / and DELETE / stay as the
 * original had them (DELETE / had no `:id` param — preserved verbatim).
 */
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  getReviews() {
    return this.reviewService.getReviews();
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  createReview(@Body() body: CreateReviewDto, @CurrentUser() user: any) {
    return this.reviewService.createReview(body, user);
  }

  @Delete()
  @HttpCode(204)
  deleteReview() {
    return this.reviewService.deleteReview(undefined);
  }
}
