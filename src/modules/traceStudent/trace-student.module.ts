import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentQuizSchema } from './schemas/student-quiz.schema';
import { QuizSchema } from '../quiz/schemas/quiz.schema';
import { TraceStudentController } from './trace-student.controller';
import { TraceStudentService } from './trace-student.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'StudentQuiz', schema: StudentQuizSchema },
      { name: 'Quiz', schema: QuizSchema },
    ]),
  ],
  controllers: [TraceStudentController],
  providers: [TraceStudentService],
})
export class TraceStudentModule {}
