import { IsOptional, IsString } from 'class-validator';

export class CreateDiscussionDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
}

export class ReplyDto {
  @IsOptional() @IsString() content?: string;
}
