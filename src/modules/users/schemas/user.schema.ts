import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import * as validator from 'validator';

export type UserDocument = HydratedDocument<User>;

/**
 * Port of `src/users/usersModel.js`. NOTE the load-bearing typo `fristName` is preserved verbatim —
 * existing documents store the field under that exact key.
 */
@Schema({ timestamps: true })
export class User {
  @Prop({ required: [true, 'Please provide a username'], unique: true })
  userName: string;

  @Prop({ required: [true, 'Please provide a first name'] })
  fristName: string;

  @Prop({ required: [true, 'Please provide a last name'] })
  lastName: string;

  @Prop({
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  })
  email: string;

  @Prop({ enum: ['student', 'instructor', 'admin'], default: 'student' })
  role: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Course' }] })
  subscribedCourses: Types.ObjectId[];

  @Prop({ required: [true, 'Please provide a password'], minlength: 8, select: false })
  password: string;

  @Prop({
    type: String,
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el: string): boolean {
        return el === (this as any).password;
      },
      message: 'Passwords are not the same!',
    },
  })
  passwordConfirm?: string;

  @Prop({ type: Date })
  passwordChangedAt?: Date;

  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetExpires?: Date;

  @Prop({ default: true })
  active: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
