import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppError } from '../../common/errors/app-error';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

/** Port of `src/courses/courseController.js`. */
@Injectable()
export class CoursesService {
  constructor(
    @InjectModel('Course') private readonly courseModel: Model<any>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getAllCourses() {
    const courses = await this.courseModel.find().lean();
    if (!courses || courses.length === 0) {
      throw new AppError('No courses found', 404);
    }
    return { status: 'success', results: courses.length, data: { courses } };
  }

  uploadVideo(file: Express.Multer.File) {
    if (!file) {
      throw new AppError('No video uploaded', 400);
    }
    return {
      status: 'success',
      message: 'Video uploaded successfully!',
      videoUrl: (file as any).path,
    };
  }

  async initCourse(body: Record<string, any>) {
    const { title, description, instructor, duration, level, modules, categories, tags, price } = body;
    const newCourse = new this.courseModel({
      title,
      description,
      instructor,
      duration,
      level,
      modules,
      categories,
      tags,
      price,
    });
    return newCourse.save();
  }

  async createModuleForCourse(courseId: string, body: Record<string, any>) {
    const { title, order, lessons } = body;
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    course.modules.push({ title, order, lessons });
    return course.save();
  }

  async createLesson(courseId: string, moduleId: string, body: Record<string, any>, file: Express.Multer.File) {
    const { title, duration, order } = body;
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    const courseModule = course.modules.id(moduleId);
    if (!courseModule) {
      throw new AppError('Module not found', 404);
    }
    if (!file) {
      throw new AppError('No video uploaded', 400);
    }

    const publicId = (file as any).filename; // Cloudinary public ID
    courseModule.lessons.push({ title, duration, videoUrl: publicId, order });
    return course.save();
  }

  /**
   * Resolve a lesson subdocument after enforcing the same access gate the original used:
   * the requesting user must be subscribed to the course.
   */
  private async resolveSubscribedLesson(courseId: string, moduleId: string, lessonId: string, user: any) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    const courseModule = course.modules.id(moduleId);
    if (!courseModule) {
      throw new AppError('Module not found', 404);
    }
    const lesson = courseModule.lessons.id(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Ensure user is subscribed to the course.
    if (!user.subscribedCourses.includes(courseId)) {
      throw new AppError('You are not subscribed to this course', 403);
    }
    return lesson;
  }

  async getLesson(courseId: string, moduleId: string, lessonId: string, user: any) {
    const lesson = await this.resolveSubscribedLesson(courseId, moduleId, lessonId, user);
    const signedUrl = this.cloudinaryService.generateSignedUrl(lesson.videoUrl);
    return { ...lesson.toObject(), signedUrl };
  }

  /** Same gate as getLesson, but returns the lesson so the controller can stream its video. */
  async getLessonForStream(courseId: string, moduleId: string, lessonId: string, user: any) {
    return this.resolveSubscribedLesson(courseId, moduleId, lessonId, user);
  }

  async updateCourse(courseId: string, updates: Record<string, any>) {
    const updatedCourse = await this.courseModel.findByIdAndUpdate(courseId, updates, { new: true });
    if (!updatedCourse) {
      throw new AppError('Course not found', 404);
    }
    return updatedCourse;
  }

  async getCoursesByCategoryOrTag(category?: string, tag?: string) {
    const filter: Record<string, any> = {};
    if (category) filter.categories = category;
    if (tag) filter.tags = tag;

    const courses = await this.courseModel.find(filter).lean();
    if (!courses || courses.length === 0) {
      throw new AppError('No courses found', 404);
    }
    return { status: 'success', results: courses.length, data: { courses } };
  }

  async deleteCourse(id: string) {
    const course = await this.courseModel.findByIdAndDelete(id);
    if (!course) {
      throw new AppError(`Course not found with id: ${id}`, 404);
    }
    return { status: 'success', data: null };
  }
}
