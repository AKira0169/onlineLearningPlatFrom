import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { QuizService } from './quiz.service';
import { QuizDto } from './dto/quiz.dto';

/** Mounted at `quiz`. All routes require auth + admin/instructor (original router-level middleware). */
@Controller('quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'instructor')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('createquiz/:courseId/:moduleId')
  @HttpCode(201)
  createQuiz(@Param('courseId') courseId: string, @Param('moduleId') moduleId: string, @Body() body: QuizDto) {
    return this.quizService.createQuiz(courseId, moduleId, body);
  }

  @Get('getQuizzes/:courseId')
  getQuizzesForCourse(@Param('courseId') courseId: string) {
    return this.quizService.getQuizzesForCourse(courseId);
  }

  @Get('getquizbyid/:quizId')
  getQuizById(@Param('quizId') quizId: string) {
    return this.quizService.getQuizById(quizId);
  }

  @Delete('deletequiz/:quizId')
  @HttpCode(204)
  deleteQuiz(@Param('quizId') quizId: string) {
    return this.quizService.deleteQuiz(quizId);
  }

  @Patch('updatequiz/:quizId')
  updateQuiz(@Param('quizId') quizId: string, @Body() body: QuizDto) {
    return this.quizService.updateQuiz(quizId, body);
  }

  @Get('getquizformodule/:moduleId')
  getQuizzesForModule(@Param('moduleId') moduleId: string) {
    return this.quizService.getQuizzesForModule(moduleId);
  }
}
