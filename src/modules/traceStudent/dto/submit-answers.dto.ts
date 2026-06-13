import { IsArray, IsOptional } from 'class-validator';

export class SubmitAnswersDto {
  @IsOptional()
  @IsArray()
  answers?: { questionId: string; selectedOption: string }[];
}
