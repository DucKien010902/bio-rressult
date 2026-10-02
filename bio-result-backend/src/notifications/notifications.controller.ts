import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Sse,
  MessageEvent,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notiService: NotificationsService) {}

  @Sse('stream')
  streamNotifications(
    @Req() req: any,
    @Query('doctor') doctor?: string,
    @Query('role') role?: string,
    @Query('source') source?: string,
    @Query('username') username?: string,
  ): Observable<MessageEvent> {
    const effectiveRole = role || req.user?.role;
    const effectiveUsername = username || req.user?.username;
    const effectiveDoctor =
      doctor ||
      (req.user?.role === 'doctor' || req.user?.role === 'bacsy'
        ? req.user?.fullName
        : undefined);
    const effectiveSource =
      source || (req.user?.role === 'lab' ? req.user?.donVi : undefined);

    return this.notiService.getNotificationStream({
      doctor: effectiveDoctor,
      role: effectiveRole,
      source: effectiveSource,
      username: effectiveUsername,
    });
  }

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
