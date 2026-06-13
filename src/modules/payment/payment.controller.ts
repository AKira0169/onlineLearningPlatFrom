import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** Public — declared without a guard (HMAC-verified inside the service). */
  @Post('paymob/webhook')
  paymentWebhook(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.paymentService.paymentWebhook(req, res);
  }

  @Post('paymob/initiate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  initiate(@Body() body: InitiatePaymentDto, @CurrentUser() user: any) {
    return this.paymentService.initiate(body, user);
  }
}
