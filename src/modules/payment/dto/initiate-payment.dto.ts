import { IsOptional } from 'class-validator';

/** Permissive, mirroring the original `req.body` destructure ({ currency, customer, courseId, couponId }). */
export class InitiatePaymentDto {
  @IsOptional()
  currency?: string;

  @IsOptional()
  customer?: Record<string, any>;

  @IsOptional()
  courseId?: string;

  @IsOptional()
  couponId?: string;
}
