import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('turnaround-time')
  async getTurnaroundTime() {
    return this.settingsService.getTurnaroundTime();
  }

  @Put('turnaround-time')
  @Roles('superadmin')
  async updateTurnaroundTime(@Body() body: Record<string, number>) {
    return this.settingsService.updateTurnaroundTime(body);
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Put(':key')
  @Roles('superadmin')
  async updateSetting(
    @Param('key') key: string,
    @Body() body: Record<string, any>,
  ) {
    return this.settingsService.updateSetting(key, body);
  }
}
