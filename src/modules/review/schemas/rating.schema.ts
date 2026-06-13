import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * Port of `src/review/reviewModel.js`. Registered under the original model name `Rating`
 * (→ collection `ratings`), NOT the folder name `review`, for data compatibility.
 */
@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ min: 1, max: 5, required: true })
  rating: number;

  @Prop({ trim: true, maxlength: 500 })
  comment: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
export type RatingDocument = HydratedDocument<Rating>;
