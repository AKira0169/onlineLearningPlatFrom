import { IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  rating?: number;

  @IsOptional()
  comment?: string;

  @IsOptional()
  courseId?: string;
}
