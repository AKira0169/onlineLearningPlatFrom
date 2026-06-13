import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** Port of `src/quiz/quizModel.js`. `correctAnswer` is `select: false` (hidden by default). */
@Schema({ timestamps: true })
export class Quiz {
  @Prop({ required: true })
  title: string;

  @Prop({
    type: [
      {
        question: { type: String, required: true },
        options: { type: [String], required: true },
        correctAnswer: { type: String, required: true, select: false },
      },
    ],
  })
  questions: { question: string; options: string[]; correctAnswer: string }[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Module', required: true })
  module: Types.ObjectId;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
export type QuizDocument = HydratedDocument<Quiz>;
