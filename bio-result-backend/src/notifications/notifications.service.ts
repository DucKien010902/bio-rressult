import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema.js';
import { BioCase } from '../cases/schemas/case.schema.js';

function toSafeString(val: any): string {
  if (!val) return '';
  if (Array.isArray(val)) return String(val[0] || '').trim();
  if (typeof val === 'string') return val.trim();
  return String(val).trim();
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notiModel: Model<NotificationDocument>,
    @InjectModel(BioCase.name)
    private caseModel: Model<BioCase>,
  ) {}

  async createNotification(data: {
    title: string;
    message: string;
    testResultId?: string;
    caseCode?: string;
    patientName?: string;
    doctorName?: string;
    sourceName?: string;
    recipientRole?: 'admin' | 'doctor' | 'source' | 'all';
    recipientUsername?: string;
    type?: string;
  }) {
    try {
      return await this.notiModel.create({
        ...data,
        isRead: false,
      });
    } catch (e) {
      console.error('[NotificationsService] Error creating notification:', e);
      return null;
    }
  }

  async findAll(params: {
    doctor?: string;
    role?: string;
    source?: string;
    username?: string;
  } = {}) {
    const doctor = toSafeString(params.doctor);
    const role = toSafeString(params.role);
    const source = toSafeString(params.source);
    const username = toSafeString(params.username);

    // Nếu không có role hoặc thông tin người dùng được cung cấp, không trả về thông báo để tránh lộ thông báo của role khác
    if (!role && !username && !doctor && !source) {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }

    const query: any = {};

    if (role === 'admin' || role === 'superadmin' || username === 'admin' || username === 'superadmin') {
      // Admin sees notifications for admin, for all, or general updates
      query.$or = [
        { recipientRole: 'admin' },
        { recipientRole: 'all' },
        { recipientRole: { $exists: false } },
        { recipientRole: '' },
      ];
    } else if (role === 'doctor' || role === 'bacsy') {
      const orList: any[] = [{ recipientRole: 'all' }];
      if (doctor) {
        orList.push({
          recipientRole: 'doctor',
          doctorName: new RegExp(doctor, 'i'),
        });
      }
      if (username) {
        orList.push({
          recipientRole: 'doctor',
          recipientUsername: username,
        });
      }
      query.$or = orList;
    } else if (role === 'lab' || role === 'source') {
      const orList: any[] = [{ recipientRole: 'all' }];
      if (source) {
        orList.push({
          recipientRole: 'source',
          sourceName: new RegExp(source, 'i'),
        });
      }
      if (username) {
        orList.push({
          recipientRole: 'source',
          recipientUsername: username,
        });
      }
      query.$or = orList;
    }

    const notifications = await this.notiModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const unreadCount = await this.notiModel.countDocuments({
      ...query,
      isRead: false,
    });

    return {
      notifications,
      unreadCount,
    };
  }

  async markRead(
    notificationId?: string,
    params?: { doctor?: string; role?: string; source?: string; username?: string },
  ) {
    if (notificationId) {
      await this.notiModel.findByIdAndUpdate(notificationId, {
        $set: { isRead: true },
      });
    } else {
      const doctor = toSafeString(params?.doctor);
      const role = toSafeString(params?.role);
      const source = toSafeString(params?.source);
      const username = toSafeString(params?.username);

      // Build filter if user marks all read for their own role
      const query: any = {};
      if (role === 'admin' || role === 'superadmin') {
        query.$or = [
          { recipientRole: 'admin' },
          { recipientRole: 'all' },
          { recipientRole: { $exists: false } },
          { recipientRole: '' },
        ];
      } else if (role === 'doctor' && doctor) {
        query.$or = [
          { recipientRole: 'doctor', doctorName: new RegExp(doctor, 'i') },
          { recipientRole: 'all' },
        ];
      } else if ((role === 'lab' || role === 'source') && source) {
        query.$or = [
          { recipientRole: 'source', sourceName: new RegExp(source, 'i') },
          { recipientRole: 'all' },
        ];
      }
      await this.notiModel.updateMany(query, { $set: { isRead: true } });
    }
    return { success: true };
  }

  async deleteOne(id: string) {
    await this.notiModel.findByIdAndDelete(id);
    return { success: true };
  }

  async clearAll(params?: {
    doctor?: string;
    role?: string;
    source?: string;
    username?: string;
  }) {
    const doctor = toSafeString(params?.doctor);
    const role = toSafeString(params?.role);
    const source = toSafeString(params?.source);
    const username = toSafeString(params?.username);

    const query: any = {};
    if (
      role === 'admin' ||
      role === 'superadmin' ||
      username === 'admin' ||
      username === 'superadmin'
    ) {
      // Admin xóa toàn bộ thông báo của hệ thống
    } else if (role === 'doctor' || role === 'bacsy') {
      const orList: any[] = [];
      if (doctor) {
        orList.push({
          recipientRole: 'doctor',
          doctorName: new RegExp(doctor, 'i'),
        });
      }
      if (username) {
        orList.push({
          recipientRole: 'doctor',
          recipientUsername: username,
        });
      }
      if (orList.length > 0) query.$or = orList;
    } else if (role === 'lab' || role === 'source') {
      const orList: any[] = [];
      if (source) {
        orList.push({
          recipientRole: 'source',
          sourceName: new RegExp(source, 'i'),
        });
      }
      if (username) {
        orList.push({
          recipientRole: 'source',
          recipientUsername: username,
        });
      }
      if (orList.length > 0) query.$or = orList;
    }

    await this.notiModel.deleteMany(query);
    return { success: true };
  }
}
