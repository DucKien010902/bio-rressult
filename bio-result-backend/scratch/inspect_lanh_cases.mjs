import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const capsCases = await db.collection('biocases').find({
    bacSiDoc: 'TS.BS NGUYỄN SỸ LÁNH'
  }).project({
    maSo: 1, hoTen: 1, loaiXetNghiem: 1, trangThai: 1, createdAt: 1
  }).toArray();

  console.log('=== 9 CA CÓ bacSiDoc LÀ IN HOA ("TS.BS NGUYỄN SỸ LÁNH") ===');
  capsCases.forEach(c => {
    console.log(`${c.maSo} | ${c.hoTen} | ${c.loaiXetNghiem} | ${c.trangThai} | Ngày: ${c.createdAt}`);
  });

  const comboCases = await db.collection('biocases').find({
    bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
    $or: [{ bacSiDoc2: /Nguyễn Sỹ Lánh/i }, { doctorName: /Nguyễn Sỹ Lánh/i }]
  }).project({
    maSo: 1, hoTen: 1, loaiXetNghiem: 1, trangThai: 1, bacSiDoc: 1, bacSiDoc2: 1, createdAt: 1
  }).toArray();

  console.log('\n=== 8 CA COMBO CÓ bacSiDoc2 LÀ NGUYỄN SỸ LÁNH ===');
  comboCases.forEach(c => {
    console.log(`${c.maSo} | ${c.hoTen} | ${c.loaiXetNghiem} | bacSiDoc2: "${c.bacSiDoc2}" | Ngày: ${c.createdAt}`);
  });

  await mongoose.disconnect();
}
run();
