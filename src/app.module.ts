import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { SecurityModule } from './common/security.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { PaymentModule } from './modules/payment/payment.module';
import { DiscussionModule } from './modules/discussion/discussion.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { TraceStudentModule } from './modules/traceStudent/trace-student.module';
import { ReviewModule } from './modules/review/review.module';
import { NoteModule } from './modules/note/note.module';
import { CouponModule } from './modules/coupon/coupon.module';

@Module({
  imports: [
    // Loads ./config.env (NOT .env) — same as the original dotenv config.
    ConfigModule.forRoot({ envFilePath: './config.env', isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Build the DB string with the literal `<password>` token replaced by DATABASE_PASSWORD.
        const uri = config.get<string>('DATABASE').replace('<password>', config.get<string>('DATABASE_PASSWORD'));
        return { uri };
      },
    }),
    SecurityModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    PaymentModule,
    DiscussionModule,
    QuizModule,
    TraceStudentModule,
    ReviewModule,
    NoteModule,
    CouponModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
