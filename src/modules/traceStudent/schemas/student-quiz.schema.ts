import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * Port of `src/traceStudent/traceStudentModel.js`. Registered under the original model name
 * `StudentQuiz` (→ collection `studentquizzes`) — NOT the folder name — for data compatibility.
 */
@Schema({ timestamps: true })
export class StudentQuiz {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Student', required: true })
  student: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Quiz', required: true })
  quiz: Types.ObjectId;

  @Prop({
    type: [
      {
        questionId: { type: MongooseSchema.Types.ObjectId, ref: 'Quiz.questions', required: true },
        selectedOption: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
  })
  answers: { questionId: Types.ObjectId; selectedOption: string; isCorrect: boolean }[];

  @Prop({ default: 0 })
  correctAnswersCount: number;

  @Prop({ default: 0 })
  totalQuestions: number;
}

export const StudentQuizSchema = SchemaFactory.createForClass(StudentQuiz);
export type StudentQuizDocument = HydratedDocument<StudentQuiz>;
