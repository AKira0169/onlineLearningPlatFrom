import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** Port of `src/disuccsion/discussionModel.js` (model name `Discussion`). */
@Schema({ timestamps: true })
export class Discussion {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  belong: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: [
      {
        user: { type: MongooseSchema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  })
  replies: { user: Types.ObjectId; content: string; createdAt: Date }[];

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [MongooseSchema.Types.ObjectId] })
  likedBy: Types.ObjectId[];
}

export const DiscussionSchema = SchemaFactory.createForClass(Discussion);
export type DiscussionDocument = HydratedDocument<Discussion>;
