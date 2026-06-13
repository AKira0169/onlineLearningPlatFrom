import { Body, Controller, Delete, Get, HttpCode, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

/**
 * `GET /:id` stays public (as in the original routes file). The list/update/delete routes are
 * guarded with `JwtAuthGuard + Roles('admin','student')` — preserving the original (instructor-
 * excluding) restriction verbatim.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'student')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'student')
  updateUser(@Param('id') id: string, @Body() updates: Record<string, any>) {
    return this.usersService.updateUser(id, updates);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'student')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
