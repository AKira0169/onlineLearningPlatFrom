import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { streamingStorage } from '../../cloudinary/streaming-storage';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateLessonDto, CreateModuleDto } from './dto/course.dto';

/**
 * Mounted at `courses`. Every route requires auth (JwtAuthGuard at class level). getLesson / stream
 * / filter are open to any authed user; the rest require `Roles('admin','instructor')`. RolesGuard
 * is a no-op on routes without `@Roles`.
 */
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('getLesson/:courseId/:moduleId/:lessonId')
  getLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.getLesson(courseId, moduleId, lessonId, user);
  }

  /**
   * Streamed playback. Forwards the client's `Range` header to Cloudinary and relays the upstream
   * status (200 or 206 Partial Content) and range headers, then pipes the video bytes through.
   */
  @Get('getLesson/:courseId/:moduleId/:lessonId/stream')
  async streamLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const lesson = await this.coursesService.getLessonForStream(courseId, moduleId, lessonId, user);
    const upstream = await this.cloudinaryService.streamAsset(lesson.videoUrl, req.headers.range);

    res.status(upstream.status);
    for (const header of ['content-range', 'accept-ranges', 'content-length', 'content-type']) {
      const value = upstream.headers[header];
      if (value) res.setHeader(header, value as string);
    }
    if (!upstream.headers['accept-ranges']) res.setHeader('Accept-Ranges', 'bytes');

    upstream.data.pipe(res);
  }

  @Get('filter')
  getCoursesByCategoryOrTag(@Query('category') category?: string, @Query('tag') tag?: string) {
    return this.coursesService.getCoursesByCategoryOrTag(category, tag);
  }

  @Get()
  @Roles('admin', 'instructor')
  getAllCourses() {
    return this.coursesService.getAllCourses();
  }

  @Post('initCourse')
  @HttpCode(201)
  @Roles('admin', 'instructor')
  initCourse(@Body() body: CreateCourseDto) {
    return this.coursesService.initCourse(body);
  }

  @Post('createModuleForCourse/:courseId')
  @HttpCode(201)
  @Roles('admin', 'instructor')
  createModuleForCourse(@Param('courseId') courseId: string, @Body() body: CreateModuleDto) {
    return this.coursesService.createModuleForCourse(courseId, body);
  }

  @Post('createLesson/:courseId/:moduleId')
  @HttpCode(201)
  @Roles('admin', 'instructor')
  @UseInterceptors(FileInterceptor('video', { storage: streamingStorage('videos') }))
  createLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: CreateLessonDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.coursesService.createLesson(courseId, moduleId, body, file);
  }

  @Patch('updateCourse/:courseId')
  @Roles('admin', 'instructor')
  updateCourse(@Param('courseId') courseId: string, @Body() updates: Record<string, any>) {
    return this.coursesService.updateCourse(courseId, updates);
  }

  @Post('upload')
  @HttpCode(200)
  @Roles('admin', 'instructor')
  @UseInterceptors(FileInterceptor('video', { storage: streamingStorage('videos') }))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.coursesService.uploadVideo(file);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('admin', 'instructor')
  deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }
}
