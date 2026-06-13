import { IsOptional, IsString } from 'class-validator';

/**
 * Intentionally permissive: the original controller does its own "Please provide email and
 * password" check and returns 400, so we don't want the ValidationPipe to pre-empt that behaviour.
 */
export class LogInDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
