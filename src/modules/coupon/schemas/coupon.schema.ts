import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** Port of `src/coupon/couponModel.js`. */
@Schema({ timestamps: true })
export class Coupon {
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Course' }] })
  course: Types.ObjectId[];

  @Prop({ required: true })
  discount: number;

  @Prop({ required: true, unique: true, set: (value: string) => value.toUpperCase() })
  couponCode: string;

  @Prop({ required: true })
  expiryDate: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
export type CouponDocument = HydratedDocument<Coupon>;
