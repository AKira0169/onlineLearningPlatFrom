import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TraceStudentService } from './trace-student.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

/** Mounted at `traceStudent`. Requires auth (no role restriction in the original). */
@Controller('traceStudent')
@UseGuards(JwtAuthGuard)
export class TraceStudentController {
  constructor(private readonly traceStudentService: TraceStudentService) {}

  @Post('createTraceStudent/:quizId')
  @HttpCode(200)
  submitAnswers(@Param('quizId') quizId: string, @Body() body: SubmitAnswersDto, @CurrentUser() user: any) {
    return this.traceStudentService.submitAnswers(quizId, body, user);
  }
}
