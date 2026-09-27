import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema.js';

export const DEFAULT_TURNAROUND_HOURS: Record<string, number> = {
  cell: 24,
  thinprep: 24,
  hpv40: 48,
  hpv20: 48,
  hpv23: 48,
  soituoi: 4,
  giaiphaubenh: 72,
  combo_hpv20_cell: 48,
  combo_hpv40_cell: 48,
  combo_hpv23_cell: 48,
  combo_hpv20_thinprep: 48,
  combo_hpv40_thinprep: 48,
  combo_hpv23_thinprep: 48,
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  async getSetting(key: string): Promise<any> {
    const found = await this.settingModel.findOne({ key }).lean().exec();
    return found ? found.value : null;
  }

  async updateSetting(key: string, value: Record<string, any>): Promise<any> {
    const updated = await this.settingModel.findOneAndUpdate(
      { key },
      { $set: { key, value } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean().exec();
    return updated.value;
  }

  async getTurnaroundTime(): Promise<Record<string, number>> {
    const custom = await this.getSetting('turnaround_time');
    if (!custom || typeof custom !== 'object') {
      return { ...DEFAULT_TURNAROUND_HOURS };
    }
    return {
      ...DEFAULT_TURNAROUND_HOURS,
      ...custom,
    };
  }

  async updateTurnaroundTime(
    payload: Record<string, number>,
  ): Promise<Record<string, number>> {
    const current = await this.getTurnaroundTime();
    const merged: Record<string, number> = { ...current };

    for (const [k, v] of Object.entries(payload)) {
      const num = Number(v);
      if (!isNaN(num) && num > 0) {
        merged[k] = num;
      }
    }

    await this.updateSetting('turnaround_time', merged);
    return merged;
  }
}
