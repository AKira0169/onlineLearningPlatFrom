import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CouponService } from './coupon.service';
import { ApplyCouponDto, CouponDto } from './dto/coupon.dto';

/** Mounted at `coupon`. Now reachable (the original router was never `app.use`-d). All routes
 *  require `admin`/`instructor`, as in the original router-level middleware. */
@Controller('coupon')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'instructor')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('createcoupon')
  @HttpCode(201)
  createCoupon(@Body() body: CouponDto) {
    return this.couponService.createCoupon(body);
  }

  @Get('getallcoupons')
  getAllCoupons() {
    return this.couponService.getAllCoupons();
  }

  @Get('getacoupnbyid/:id')
  getCouponById(@Param('id') id: string) {
    return this.couponService.getCouponById(id);
  }

  @Put('updatecoupon/:id')
  updateCoupon(@Param('id') id: string, @Body() body: CouponDto) {
    return this.couponService.updateCoupon(id, body);
  }

  @Delete('deletecoupon/:id')
  @HttpCode(204)
  deleteCoupon(@Param('id') id: string) {
    return this.couponService.deleteCoupon(id);
  }

  @Post('applycoupon')
  @HttpCode(200)
  applyCouponToCourse(@Body() body: ApplyCouponDto) {
    return this.couponService.applyCouponToCourse(body);
  }
}
