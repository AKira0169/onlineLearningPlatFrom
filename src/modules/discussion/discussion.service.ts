import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AppError } from '../../common/errors/app-error';
import { CreateDiscussionDto, ReplyDto } from './dto/discussion.dto';

/** Port of `src/disuccsion/discussionController.js`. NOTE: the lesson discussion array is `disucssion`. */
@Injectable()
export class DiscussionService {
  constructor(
    @InjectModel('Discussion') private readonly discussionModel: Model<any>,
    @InjectModel('Course') private readonly courseModel: Model<any>,
  ) {}

  /** Resolve a lesson subdocument (two levels deep) from a loaded course by its lesson id. */
  private findLessonInCourse(course: any, lessonId: string) {
    return course.modules.flatMap((module: any) => module.lessons).find((l: any) => l._id.toString() === lessonId);
  }

  async createDiscussion(lessonId: string, body: CreateDiscussionDto, user: any) {
    try {
      const { title, content } = body;

      const discussion = await this.discussionModel.create({
        belong: user._id,
        title,
        content,
      });

      const course = await this.courseModel.findOne({ 'modules.lessons._id': lessonId });
      if (!course) {
        throw new AppError('Course or Lesson not found', 404);
      }

      const lesson = this.findLessonInCourse(course, lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found within the course', 404);
      }

      lesson.disucssion.push(discussion._id);
      await course.save();

      return { status: 'success', data: discussion };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }

  async deleteDiscussion(discussionId: string) {
    try {
      const discussion = await this.discussionModel.findByIdAndDelete(discussionId);
      if (!discussion) {
        throw new AppError('Discussion not found', 404);
      }

      await this.courseModel.updateMany(
        { 'modules.lessons.disucssion': discussionId },
        { $pull: { 'modules.$[].lessons.$[lesson].disucssion': discussionId } },
        { arrayFilters: [{ 'lesson.disucssion': discussionId }] },
      );

      return { status: 'success', message: 'Discussion deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }

  async getAllDiscussions() {
    try {
      const discussions = await this.discussionModel
        .find()
        .populate({ path: 'belong', select: 'username' })
        .populate({ path: 'replies.user', select: 'username' })
        .lean();

      return {
        status: 'success',
        results: discussions.length,
        data: discussions.map((discussion: any) => ({
          _id: discussion._id,
          title: discussion.title,
          content: discussion.content,
          belong: {
            _id: discussion.belong._id,
            username: discussion.belong.username,
          },
          replies: discussion.replies.map((reply: any) => ({
            _id: reply._id,
            content: reply.content,
            createdAt: reply.createdAt,
            user: {
              _id: reply.user._id,
              username: reply.user.username,
            },
          })),
          likes: discussion.likes,
          likedBy: discussion.likedBy,
        })),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }

  async getDiscussionsForLesson(lessonId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new AppError('Invalid lesson ID format', 400);
      }

      const course = await this.courseModel.findOne({ 'modules.lessons._id': lessonId }).populate({
        path: 'modules.lessons.disucssion',
        select: 'title content replies likes likedBy createdAt updatedAt',
      });

      if (!course) {
        throw new AppError('Course or Lesson not found', 404);
      }

      const lesson = this.findLessonInCourse(course, lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found within the course', 404);
      }

      return { status: 'success', data: { discussions: lesson.disucssion } };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }

  async addReplyToDiscussion(discussionId: string, body: ReplyDto, user: any) {
    try {
      const { content } = body;
      const discussion = await this.discussionModel.findById(discussionId);
      if (!discussion) {
        throw new AppError('Discussion not found', 404);
      }

      discussion.replies.push({ user: user._id, content });
      await discussion.save();

      return { status: 'success', data: discussion };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }

  async likeOrUnlikeDiscussion(discussionId: string, user: any) {
    try {
      const userId = user._id;
      const discussion = await this.discussionModel.findById(discussionId);
      if (!discussion) {
        throw new AppError('Discussion not found', 404);
      }

      const userIndex = discussion.likedBy.indexOf(userId);
      if (userIndex > -1) {
        discussion.likedBy.splice(userIndex, 1);
        discussion.likes -= 1;
      } else {
        discussion.likedBy.push(userId);
        discussion.likes += 1;
      }

      await discussion.save();

      return { status: 'success', data: discussion };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message, 500);
    }
  }
}
