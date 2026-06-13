import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Returns the authenticated user that `JwtAuthGuard` placed on `req.user` (the original `req.user`). */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
