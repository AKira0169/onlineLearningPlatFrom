import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LogInDto } from './dto/log-in.dto';

/** Mounted at `users` (same paths as the original `/api/v1/users/signUp` and `/logIn`). */
@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  signUp(@Body() dto: SignUpDto, @Res() res: Response): Promise<void> {
    return this.authService.signUp(dto, res);
  }

  @Post('logIn')
  logIn(@Body() dto: LogInDto, @Res() res: Response): Promise<void> {
    return this.authService.logIn(dto, res);
  }
}
