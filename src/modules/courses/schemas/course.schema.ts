import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * Port of `src/courses/courseModel.js`. Course → modules[] → lessons[] are all embedded
 * subdocuments in a single document (accessed via `course.modules.id(...)` etc).
 * NOTE: the load-bearing typo `disucssion` (the per-lesson discussion array) is preserved verbatim.
 */
@Schema({ timestamps: true })
export class Lesson {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Discussion' }] })
  disucssion: Types.ObjectId[];

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  order: number;
}
export const LessonSchema = SchemaFactory.createForClass(Lesson);

@Schema({ timestamps: true })
export class CourseModule {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  order: number;

  @Prop({ type: [LessonSchema] })
  lessons: Lesson[];
}
export const CourseModuleSchema = SchemaFactory.createForClass(CourseModule);

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  instructor: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ enum: ['Beginner', 'Intermediate', 'Advanced'], required: true })
  level: string;

  @Prop({ type: [CourseModuleSchema] })
  modules: CourseModule[];

  @Prop({ type: [String] })
  categories: string[];

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ required: true })
  price: number;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  enrolledStudents: Types.ObjectId[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
export type CourseDocument = HydratedDocument<Course>;
