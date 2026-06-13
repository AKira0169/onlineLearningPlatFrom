import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppError } from '../../common/errors/app-error';
import { QuizDto } from './dto/quiz.dto';

/** Port of `src/quiz/quizController.js`. */
@Injectable()
export class QuizService {
  constructor(
    @InjectModel('Quiz') private readonly quizModel: Model<any>,
    @InjectModel('Course') private readonly courseModel: Model<any>,
  ) {}

  async createQuiz(courseId: string, moduleId: string, body: QuizDto) {
    const { title, questions } = body;
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (moduleId) {
      const courseModule = course.modules.id(moduleId);
      if (!courseModule) {
        throw new AppError('Module not found in the course', 404);
      }
    }

    const quiz = new this.quizModel({
      title,
      questions,
      course: courseId,
      module: moduleId || null,
    });
    await quiz.save();

    return { message: 'Quiz created successfully', quiz };
  }

  async getQuizzesForCourse(courseId: string) {
    const quizzes = await this.quizModel.find({ course: courseId }).lean();
    return { quizzes };
  }

  async getQuizById(quizId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }
    return { quiz };
  }

  async deleteQuiz(quizId: string) {
    const quiz = await this.quizModel.findByIdAndDelete(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }
    return { message: 'Quiz deleted successfully' };
  }

  async updateQuiz(quizId: string, body: QuizDto) {
    const { title, questions } = body;
    const quiz = await this.quizModel.findByIdAndUpdate(quizId, { title, questions }, { new: true });
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }
    return { message: 'Quiz updated successfully', quiz };
  }

  async getQuizzesForModule(moduleId: string) {
    const quizzes = await this.quizModel.find({ module: moduleId }).lean();
    if (!quizzes || quizzes.length === 0) {
      throw new AppError('No quizzes found for this module', 404);
    }
    return { quizzes };
  }
}
