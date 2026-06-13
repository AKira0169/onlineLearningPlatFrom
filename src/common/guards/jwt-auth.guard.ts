import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppError } from '../errors/app-error';

/**
 * Port of `authController.protect`. Reads the JWT **only** from the `jwt` httpOnly cookie
 * (no Authorization header), verifies it, loads the user, and sets `req.user`.
 *
 * JWT verification errors (JsonWebTokenError / TokenExpiredError) are rethrown so the global
 * exception filter maps them to 401 — exactly as the original error handler did.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.cookies?.jwt;
    if (!token) {
      throw new AppError('You are not logged in! Please log in to get access', 401);
    }

    const decoded = await this.jwtService.verifyAsync(token);

    const currentUser = await this.userModel.findById(decoded.id);
    if (!currentUser) {
      throw new AppError('The user belonging to this token does no longer exist', 401);
    }

    request.user = currentUser;
    return true;
  }
}
