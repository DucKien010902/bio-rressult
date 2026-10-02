import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const doctors = await db.collection('doctors').find({}).toArray();
  console.log('--- DANH SÁCH BÁC SĨ TRONG HỆ THỐNG ---');
  doctors.forEach(d => {
    console.log(`[${d.code}] ID: ${d._id} | Tên: ${d.fullName} | Đơn vị: ${d.donVi}`);
  });

  const docMap = {};
  doctors.forEach(d => {
    docMap[d.code] = {
      id: String(d._id),
      code: d.code,
      fullName: d.fullName
    };
  });

  console.log('\n--- BẮT ĐẦU CẬP NHẬT MÃ DUY NHẤT CHO TOÀN BỘ 51 CA XÉT NGHIỆM ---');

  // 1. Cập nhật 30 ca của bacsi_lanh (TS.BS Nguyễn Sỹ Lánh - Title Case, Giải phẫu bệnh)
  const resLanh1 = await db.collection('biocases').updateMany(
    { bacSiDoc: 'TS.BS Nguyễn Sỹ Lánh' },
    {
      $set: {
        bacSiDocUsername: 'bacsi_lanh',
        bacSiDocId: docMap['bacsi_lanh']?.id || '6abb3321409940662a0a4b0a'
      }
    }
  );
  const resLanh2 = await db.collection('biocases').updateMany(
    { bacSiDoc2: 'TS.BS Nguyễn Sỹ Lánh' },
    {
      $set: {
        bacSiDoc2Username: 'bacsi_lanh',
        bacSiDoc2Id: docMap['bacsi_lanh']?.id || '6abb3321409940662a0a4b0a'
      }
    }
  );
  console.log(`1. bacsi_lanh (GPB): BS1 update = ${resLanh1.modifiedCount}, BS2 update = ${resLanh2.modifiedCount}`);

  // 2. Cập nhật 9 ca đơn của bacsi_lanh2 (TS.BS NGUYỄN SỸ LÁNH - ALL CAPS, Tế bào / HPV)
  const resLanh2_1 = await db.collection('biocases').updateMany(
    { bacSiDoc: 'TS.BS NGUYỄN SỸ LÁNH' },
    {
      $set: {
        bacSiDocUsername: 'bacsi_lanh2',
        bacSiDocId: docMap['bacsi_lanh2']?.id || '6abb43c149e6542db550e6fe'
      }
    }
  );
  const resLanh2_2 = await db.collection('biocases').updateMany(
    { bacSiDoc2: 'TS.BS NGUYỄN SỸ LÁNH' },
    {
      $set: {
        bacSiDoc2Username: 'bacsi_lanh2',
        bacSiDoc2Id: docMap['bacsi_lanh2']?.id || '6abb43c149e6542db550e6fe'
      }
    }
  );
  console.log(`2. bacsi_lanh2 (Tế bào & ca đọc 2): BS1 update = ${resLanh2_1.modifiedCount}, BS2 update = ${resLanh2_2.modifiedCount}`);

  // 3. Cập nhật các ca của bacsi_duong
  const resDuong1 = await db.collection('biocases').updateMany(
    { bacSiDoc: /Nguyễn Khánh Dương/i },
    {
      $set: {
        bacSiDocUsername: 'bacsi_duong',
        bacSiDocId: docMap['bacsi_duong']?.id || '6abb3322409940662a0a4b0b'
      }
    }
  );
  const resDuong2 = await db.collection('biocases').updateMany(
    { bacSiDoc2: /Nguyễn Khánh Dương/i },
    {
      $set: {
        bacSiDoc2Username: 'bacsi_duong',
        bacSiDoc2Id: docMap['bacsi_duong']?.id || '6abb3322409940662a0a4b0b'
      }
    }
  );
  console.log(`3. bacsi_duong: BS1 update = ${resDuong1.modifiedCount}, BS2 update = ${resDuong2.modifiedCount}`);

  // 4. Cập nhật các ca của bacsi_hung (bao gồm 8 ca combo BS1: PHẠM THẾ HÙNG, BS2: NGUYỄN SỸ LÁNH)
  const resHung1 = await db.collection('biocases').updateMany(
    { bacSiDoc: /PHẠM THẾ HÙNG/i },
    {
      $set: {
        bacSiDocUsername: 'bacsi_hung',
        bacSiDocId: docMap['bacsi_hung']?.id || '6abb3322409940662a0a4b0c'
      }
    }
  );
  const resHung2 = await db.collection('biocases').updateMany(
    { bacSiDoc2: /PHẠM THẾ HÙNG/i },
    {
      $set: {
        bacSiDoc2Username: 'bacsi_hung',
        bacSiDoc2Id: docMap['bacsi_hung']?.id || '6abb3322409940662a0a4b0c'
      }
    }
  );
  console.log(`4. bacsi_hung: BS1 update = ${resHung1.modifiedCount}, BS2 update = ${resHung2.modifiedCount}`);

  // 5. Cập nhật các ca của bacsi_truc nếu có
  const resTruc1 = await db.collection('biocases').updateMany(
    { bacSiDoc: /Nguyễn Trung Trực/i },
    {
      $set: {
        bacSiDocUsername: 'bacsi_truc',
        bacSiDocId: docMap['bacsi_truc']?.id || '6abb3322409940662a0a4b0d'
      }
    }
  );
  const resTruc2 = await db.collection('biocases').updateMany(
    { bacSiDoc2: /Nguyễn Trung Trực/i },
    {
      $set: {
        bacSiDoc2Username: 'bacsi_truc',
        bacSiDoc2Id: docMap['bacsi_truc']?.id || '6abb3322409940662a0a4b0d'
      }
    }
  );
  console.log(`5. bacsi_truc: BS1 update = ${resTruc1.modifiedCount}, BS2 update = ${resTruc2.modifiedCount}`);

  // 6. Cập nhật các ca của bacsi_son nếu có
  const resSon1 = await db.collection('biocases').updateMany(
    { bacSiDoc: /Trịnh Ngọc Sơn/i },
    {
      $set: {
        bacSiDocUsername: 'bacsi_son',
        bacSiDocId: docMap['bacsi_son']?.id || '6abb3322409940662a0a4b0e'
      }
    }
  );
  const resSon2 = await db.collection('biocases').updateMany(
    { bacSiDoc2: /Trịnh Ngọc Sơn/i },
    {
      $set: {
        bacSiDoc2Username: 'bacsi_son',
        bacSiDoc2Id: docMap['bacsi_son']?.id || '6abb3322409940662a0a4b0e'
      }
    }
  );
  console.log(`6. bacsi_son: BS1 update = ${resSon1.modifiedCount}, BS2 update = ${resSon2.modifiedCount}`);

  // KIỂM TRA TOÀN BỘ SỐ CA SAU KHI CẬP NHẬT
  console.log('\n--- THỐNG KÊ CHI TIẾT SỐ CA CỦA MỖI BÁC SĨ ---');

  for (const code of ['bacsi_lanh', 'bacsi_lanh2', 'bacsi_duong', 'bacsi_hung', 'bacsi_truc', 'bacsi_son']) {
    const asDoc1 = await db.collection('biocases').countDocuments({ bacSiDocUsername: code });
    const asDoc2Only = await db.collection('biocases').countDocuments({
      bacSiDoc2Username: code,
      bacSiDocUsername: { $ne: code }
    });
    const totalAssigned = await db.collection('biocases').countDocuments({
      $or: [{ bacSiDocUsername: code }, { bacSiDoc2Username: code }]
    });

    console.log(`- [${code.padEnd(12)}]: Tổng ${String(totalAssigned).padStart(2)} ca (Là BS đọc 1: ${asDoc1} ca | Là BS đọc 2 (Combo): ${asDoc2Only} ca)`);
  }

  // Kiểm tra còn ca nào chưa có username không
  const missingUsername = await db.collection('biocases').countDocuments({
    $and: [
      { bacSiDoc: { $exists: true, $nin: ['', null] } },
      { $or: [{ bacSiDocUsername: { $exists: false } }, { bacSiDocUsername: '' }] }
    ]
  });
  console.log(`\nSố ca còn thiếu bacSiDocUsername: ${missingUsername}`);

  await mongoose.disconnect();
  console.log('--- HOÀN TẤT DI CHUYỂN DỮ LIỆU ---');
}

migrate().catch(console.error);
