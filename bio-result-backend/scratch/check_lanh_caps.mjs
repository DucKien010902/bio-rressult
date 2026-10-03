import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const cases = await db.collection('biocases').find({}).toArray();
  console.log('Tổng số ca hiện có trong CSDL:', cases.length);

  const missingList = [];
  cases.forEach(c => {
    const b1 = c.bacSiDoc || '';
    const u1 = c.bacSiDocUsername || '';
    const b2 = c.bacSiDoc2 || '';
    const u2 = c.bacSiDoc2Username || '';

    if ((b1 && !u1) || (b2 && !u2)) {
      missingList.push({
        _id: String(c._id),
        maSo: c.maSo,
        hoTen: c.hoTen,
        loaiXetNghiem: c.loaiXetNghiem,
        bacSiDoc: b1,
        bacSiDocUsername: u1,
        bacSiDoc2: b2,
        bacSiDoc2Username: u2,
        trangThai: c.trangThai
      });
    }
  });

  console.log('Số ca có BS nhưng chưa có bacSiDocUsername:', missingList.length);
  if (missingList.length > 0) {
    console.log('Chi tiết các ca chưa có username:');
    console.log(JSON.stringify(missingList, null, 2));
  }

  // Kiểm tra tất cả ca có liên quan đến Lãnh/Lánh
  const lanhCases = cases.filter(c => {
    const b1 = (c.bacSiDoc || '').toLowerCase();
    const b2 = (c.bacSiDoc2 || '').toLowerCase();
    return b1.includes('lánh') || b1.includes('lãnh') || b2.includes('lánh') || b2.includes('lãnh');
  });

  console.log('\n--- TẤT CẢ CÁC CA LIÊN QUAN ĐẾN BS LÁNH/LÃNH (' + lanhCases.length + ' ca) ---');
  lanhCases.forEach(c => {
    console.log(
      '[' + c.maSo + '] ' + c.hoTen.padEnd(20) +
      ' | Loại: ' + (c.loaiXetNghiem || '').padEnd(22) +
      ' | BS1: [' + (c.bacSiDoc || '') + '] (' + (c.bacSiDocUsername || 'CHƯA CÓ') + ')' +
      ' | BS2: [' + (c.bacSiDoc2 || '') + '] (' + (c.bacSiDoc2Username || 'CHƯA CÓ') + ')'
    );
  });

  await mongoose.disconnect();
}
check();
