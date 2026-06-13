import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { SignUpDto } from './dto/sign-up.dto';
import { LogInDto } from './dto/log-in.dto';

/** Port of `middleware/authController.js` (signUp / logIn / createSendToken). */
@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private signToken(id: string): string {
    return this.jwtService.sign({ id });
  }

  private createSendToken(user: any, statusCode: number, res: Response): void {
    const cookieExpiresIn = Number(this.config.get<string>('JWT_COOKIE_EXPIRES_IN'));
    const cookieOptions: Record<string, any> = {
      expires: new Date(Date.now() + cookieExpiresIn * 60 * 1000),
      httpOnly: true,
    };
    if (this.config.get<string>('NODE_ENV') === 'production') cookieOptions.secure = true;

    const token = this.signToken(user._id.toString());
    res.cookie('jwt', token, cookieOptions);
    // `select: false` only hides password on queries — a freshly created/queried doc still holds it.
    user.password = undefined;
    res.status(statusCode).json({ status: 'success', token, data: { user } });
  }

  async signUp(dto: SignUpDto, res: Response): Promise<void> {
    if (dto.password !== dto.passwordConfirm) {
      res.status(400).json({ status: 'fail', message: 'Passwords do not match' });
      return;
    }
    const user = await this.userModel.create({
      userName: dto.userName,
      fristName: dto.fristName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      passwordConfirm: dto.passwordConfirm,
    });
    this.createSendToken(user, 201, res);
  }

  async logIn(dto: LogInDto, res: Response): Promise<void> {
    const { email, password } = dto;
    if (!email || !password) {
      res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
      return;
    }
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
      return;
    }
    this.createSendToken(user, 200, res);
  }
}
