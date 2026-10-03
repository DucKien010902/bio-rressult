import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix4Cases() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const docLanh2 = await db.collection('doctors').findOne({ code: 'bacsi_lanh2' });
  const docHung = await db.collection('doctors').findOne({ code: 'bacsi_hung' });

  const lanh2Id = docLanh2 ? String(docLanh2._id) : '6abb43c149e6542db550e6fe';
  const hungId = docHung ? String(docHung._id) : '6abb3322409940662a0a4b0c';

  console.log('--- CẬP NHẬT MÃ DUY NHẤT CHO 4 CA MỚI ---');

  // 1. GTHD-TB-948
  const r1 = await db.collection('biocases').updateOne(
    { maSo: 'GTHD-TB-948' },
    {
      $set: {
        bacSiDocUsername: 'bacsi_lanh2',
        bacSiDocId: lanh2Id
      }
    }
  );
  console.log('1. GTHD-TB-948 updated:', r1.modifiedCount);

  // 2. GTHD-TB-297
  const r2 = await db.collection('biocases').updateOne(
    { maSo: 'GTHD-TB-297' },
    {
      $set: {
        bacSiDocUsername: 'bacsi_lanh2',
        bacSiDocId: lanh2Id
      }
    }
  );
  console.log('2. GTHD-TB-297 updated:', r2.modifiedCount);

  // 3. GTHD-CELL-312
  const r3 = await db.collection('biocases').updateOne(
    { maSo: 'GTHD-CELL-312' },
    {
      $set: {
        bacSiDocUsername: 'bacsi_lanh2',
        bacSiDocId: lanh2Id
      }
    }
  );
  console.log('3. GTHD-CELL-312 updated:', r3.modifiedCount);

  // 4. GTHD-CB20TP-956 (Combo: BS1 là BS Hùng, BS2 là BS Lánh viết hoa)
  const r4 = await db.collection('biocases').updateOne(
    { maSo: 'GTHD-CB20TP-956' },
    {
      $set: {
        bacSiDocUsername: 'bacsi_hung',
        bacSiDocId: hungId,
        bacSiDoc2Username: 'bacsi_lanh2',
        bacSiDoc2Id: lanh2Id
      }
    }
  );
  console.log('4. GTHD-CB20TP-956 updated:', r4.modifiedCount);

  // Kiểm tra lại toàn bộ CSDL xem còn ca nào chưa có username
  const stillMissing = await db.collection('biocases').countDocuments({
    $and: [
      { bacSiDoc: { $exists: true, $nin: ['', null] } },
      { $or: [{ bacSiDocUsername: { $exists: false } }, { bacSiDocUsername: '' }] }
    ]
  });
  console.log('\nSố ca còn thiếu bacSiDocUsername sau khi cập nhật:', stillMissing);

  // Thống kê lại số ca cho bacsi_lanh và bacsi_lanh2
  const countLanh = await db.collection('biocases').countDocuments({
    $or: [{ bacSiDocUsername: 'bacsi_lanh' }, { bacSiDoc2Username: 'bacsi_lanh' }]
  });
  const countLanh2 = await db.collection('biocases').countDocuments({
    $or: [{ bacSiDocUsername: 'bacsi_lanh2' }, { bacSiDoc2Username: 'bacsi_lanh2' }]
  });

  console.log(`\n=> KẾT QUẢ HIỆN TẠI TRONG CSDL:`);
  console.log(`- Tài khoản [bacsi_lanh]  (Title Case): ${countLanh} ca`);
  console.log(`- Tài khoản [bacsi_lanh2] (Viết HOA) : ${countLanh2} ca`);

  await mongoose.disconnect();
}
fix4Cases().catch(console.error);
