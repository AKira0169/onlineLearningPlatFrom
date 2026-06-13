import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionDto, ReplyDto } from './dto/discussion.dto';

/** Mounted at `discussion`. All routes require auth; delete additionally requires admin/instructor. */
@Controller('discussion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post('createdisuccsion/:lessonId')
  @HttpCode(201)
  createDiscussion(@Param('lessonId') lessonId: string, @Body() body: CreateDiscussionDto, @CurrentUser() user: any) {
    return this.discussionService.createDiscussion(lessonId, body, user);
  }

  @Get('discussions')
  getAllDiscussions() {
    return this.discussionService.getAllDiscussions();
  }

  @Get('getdiscussion/:lessonId')
  getDiscussionsForLesson(@Param('lessonId') lessonId: string) {
    return this.discussionService.getDiscussionsForLesson(lessonId);
  }

  @Delete(':discussionId')
  @HttpCode(204)
  @Roles('admin', 'instructor')
  deleteDiscussion(@Param('discussionId') discussionId: string) {
    return this.discussionService.deleteDiscussion(discussionId);
  }

  @Post('replytodiscussion/:discussionId')
  @HttpCode(201)
  addReplyToDiscussion(@Param('discussionId') discussionId: string, @Body() body: ReplyDto, @CurrentUser() user: any) {
    return this.discussionService.addReplyToDiscussion(discussionId, body, user);
  }

  @Post('like/:discussionId')
  @HttpCode(200)
  likeOrUnlikeDiscussion(@Param('discussionId') discussionId: string, @CurrentUser() user: any) {
    return this.discussionService.likeOrUnlikeDiscussion(discussionId, user);
  }
}
