import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema.js';
import { BioCase } from '../cases/schemas/case.schema.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notiModel: Model<NotificationDocument>,
    @InjectModel(BioCase.name)
    private caseModel: Model<BioCase>,
  ) {}

  async findAll(doctor?: string, role?: string) {
    // Seed initial notifications if collection is empty
    const count = await this.notiModel.countDocuments();
    if (count === 0) {
      await this.seedDefaultNotifications();
    }

    const query: any = {};
    if (role === 'doctor' && doctor && doctor.trim() !== '') {
      query.$or = [
        { doctorName: new RegExp(doctor.trim(), 'i') },
        { recipientRole: 'all' },
        { recipientRole: 'doctor' },
      ];
    }

    const notifications = await this.notiModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(30)
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

  async markRead(notificationId?: string) {
    if (notificationId) {
      await this.notiModel.findByIdAndUpdate(notificationId, {
        $set: { isRead: true },
      });
    } else {
      await this.notiModel.updateMany({}, { $set: { isRead: true } });
    }
    return { success: true };
  }

  private async seedDefaultNotifications() {
    // Look up some actual cases to link IDs
    const sampleCases = await this.caseModel.find().limit(6).exec();

    const items = [
      {
        title: 'Đã nhận mẫu & phân công: GTHD-CB23TP011',
        message:
          'Admin phòng Lab đã nhận mẫu phiếu GTHD-CB23TP011 (NGUYỄN THỊ TÍNH). Bác sĩ đọc: BS CK1 PHẠM THẾ HÙNG',
        caseCode: 'GTHD-CB23TP011',
        patientName: 'NGUYỄN THỊ TÍNH',
        doctorName: 'BS CK1 PHẠM THẾ HÙNG',
        recipientRole: 'all',
        isRead: false,
        testResultId: sampleCases[0]?._id?.toString() || '',
      },
      {
        title: 'Đã nhận mẫu & phân công: GTHD-20HP064',
        message:
          'Admin phòng Lab đã nhận mẫu phiếu GTHD-20HP064 (ĐINH THỊ THÚY HẰNG). Bác sĩ đọc: BS CK1 PHẠM THẾ HÙNG',
        caseCode: 'GTHD-20HP064',
        patientName: 'ĐINH THỊ THÚY HẰNG',
        doctorName: 'BS CK1 PHẠM THẾ HÙNG',
        recipientRole: 'all',
        isRead: false,
        testResultId: sampleCases[1]?._id?.toString() || '',
      },
      {
        title: 'Đã nhận mẫu & phân công: GTHD-20HP067',
        message:
          'Admin phòng Lab đã nhận mẫu phiếu GTHD-20HP067 (NGUYỄN THỊ BẾN). Bác sĩ đọc: BS CK1 PHẠM THẾ HÙNG',
        caseCode: 'GTHD-20HP067',
        patientName: 'NGUYỄN THỊ BẾN',
        doctorName: 'BS CK1 PHẠM THẾ HÙNG',
        recipientRole: 'all',
        isRead: false,
        testResultId: sampleCases[2]?._id?.toString() || '',
      },
      {
        title: 'Đã hoàn tất kết quả: GTHD-40HP015',
        message:
          'Bác sĩ BS CK1 PHẠM THẾ HÙNG đã ký hoàn tất kết quả xét nghiệm cho bệnh nhân VŨ THỊ BÍCH NGỌC.',
        caseCode: 'GTHD-40HP015',
        patientName: 'VŨ THỊ BÍCH NGỌC',
        doctorName: 'BS CK1 PHẠM THẾ HÙNG',
        recipientRole: 'all',
        isRead: false,
        testResultId: sampleCases[3]?._id?.toString() || '',
      },
      {
        title: 'Đã hoàn tất kết quả: GTHD-40HP014',
        message:
          'Bác sĩ TS . BS Nguyễn Khánh Dương đã ký hoàn tất kết quả phiếu GTHD-40HP014 (NGUYỄN THỊ THỦY).',
        caseCode: 'GTHD-40HP014',
        patientName: 'NGUYỄN THỊ THỦY',
        doctorName: 'TS . BS Nguyễn Khánh Dương',
        recipientRole: 'all',
        isRead: false,
        testResultId: sampleCases[4]?._id?.toString() || '',
      },
    ];

    await this.notiModel.insertMany(items);
  }
}
