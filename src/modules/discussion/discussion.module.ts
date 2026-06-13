import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscussionSchema } from './schemas/discussion.schema';
import { CourseSchema } from '../courses/schemas/course.schema';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Discussion', schema: DiscussionSchema },
      { name: 'Course', schema: CourseSchema },
    ]),
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService],
})
export class DiscussionModule {}
