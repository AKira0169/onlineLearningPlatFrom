import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** Port of `src/payment/paymentModel.js` (no `timestamps`; explicit `createdAt` default). */
@Schema()
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  orderId: string;

  @Prop()
  amount: number;

  @Prop()
  currency: string;

  @Prop({ type: Object })
  customer: Record<string, any>;

  @Prop()
  status: boolean;

  @Prop()
  hmac: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
export type PaymentDocument = HydratedDocument<Payment>;
