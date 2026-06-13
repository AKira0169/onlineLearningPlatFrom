import { IsOptional } from 'class-validator';

/** Permissive — the original controllers do their own required-field checks. */
export class CouponDto {
  @IsOptional()
  course?: any;

  @IsOptional()
  discount?: number;

  @IsOptional()
  couponCode?: string;

  @IsOptional()
  expiryDate?: string;
}

export class ApplyCouponDto {
  @IsOptional()
  courseId?: string;

  @IsOptional()
  couponCode?: string;
}
