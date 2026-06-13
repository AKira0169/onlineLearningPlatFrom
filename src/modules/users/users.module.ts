import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/** The `User` model is provided globally by SecurityModule. */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
