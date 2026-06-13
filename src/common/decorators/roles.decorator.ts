import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Port of `authorization.restrictTo(...roles)` — attaches the allowed roles to a route handler. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
