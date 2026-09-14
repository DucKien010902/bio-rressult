import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notiService: NotificationsService) {}

  @Get()
  async findAll(
    @Query('doctor') doctor?: string,
    @Query('role') role?: string,
  ) {
    return this.notiService.findAll(doctor, role);
  }

  @Put()
  async markRead(@Body() body: { notificationId?: string }) {
    return this.notiService.markRead(body?.notificationId);
  }
}
