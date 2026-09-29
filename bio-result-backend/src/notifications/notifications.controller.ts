import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notiService: NotificationsService) {}

  @Get()
  async findAll(
    @Query('doctor') doctor?: string,
    @Query('role') role?: string,
    @Query('source') source?: string,
    @Query('username') username?: string,
  ) {
    return this.notiService.findAll({ doctor, role, source, username });
  }

  @Put()
  async markRead(
    @Body() body: { notificationId?: string },
    @Query('doctor') doctor?: string,
    @Query('role') role?: string,
    @Query('source') source?: string,
    @Query('username') username?: string,
  ) {
    return this.notiService.markRead(body?.notificationId, {
      doctor,
      role,
      source,
      username,
    });
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    return this.notiService.deleteOne(id);
  }

  @Delete()
  async clearAll(
    @Query('doctor') doctor?: string,
    @Query('role') role?: string,
    @Query('source') source?: string,
    @Query('username') username?: string,
  ) {
    return this.notiService.clearAll({ doctor, role, source, username });
  }
}
