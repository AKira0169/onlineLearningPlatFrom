import { IsArray, IsOptional, IsString } from 'class-validator';

export class QuizDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsArray() questions?: any[];
}
