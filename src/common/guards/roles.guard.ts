import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppError } from '../errors/app-error';

/**
 * Port of `authorization.restrictTo`. Reads the roles set by `@Roles(...)` and rejects with 403
 * (same message) when `req.user.role` is not in the list. Routes with no `@Roles` are unrestricted.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    if (!roles.includes(request.user?.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    return true;
  }
}
