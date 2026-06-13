import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTOs are intentionally permissive — the original controllers simply destructured `req.body`.
 * The only place coercion matters is the streamed lesson upload, where `duration`/`order` arrive as
 * strings from multipart and must be turned into numbers (the schema requires Number).
 */
export class CreateCourseDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() instructor?: string;
  @IsOptional() duration?: number;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsArray() modules?: any[];
  @IsOptional() @IsArray() categories?: string[];
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() price?: number;
}

export class CreateModuleDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() order?: number;
  @IsOptional() @IsArray() lessons?: any[];
}

export class CreateLessonDto {
  @IsString()
  title: string;

  @Type(() => Number)
  @IsNumber()
  duration: number;

  @Type(() => Number)
  @IsNumber()
  order: number;
}
