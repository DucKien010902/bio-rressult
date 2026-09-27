import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('turnaround-time')
  async getTurnaroundTime() {
    return this.settingsService.getTurnaroundTime();
  }

  @Put('turnaround-time')
  async updateTurnaroundTime(@Body() body: Record<string, number>) {
    return this.settingsService.updateTurnaroundTime(body);
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Put(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() body: Record<string, any>,
  ) {
    return this.settingsService.updateSetting(key, body);
  }
}
