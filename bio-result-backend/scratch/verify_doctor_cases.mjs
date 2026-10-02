import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testQuery() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const testDoctors = ['bacsi_lanh', 'bacsi_lanh2', 'bacsi_duong', 'bacsi_hung', 'bacsi_truc', 'bacsi_son'];

  console.log('=== KIỂM TRA LỌC CA THEO TÀI KHOẢN DUY NHẤT (USERNAME/CODE) ===');
  for (const doc of testDoctors) {
    const query = {
      $or: [
        { bacSiDocUsername: doc },
        { bacSiDoc2Username: doc }
      ]
    };
    const cases = await db.collection('biocases').find(query).toArray();
    console.log(`Bác sĩ [${doc}]: tìm thấy ${cases.length} ca.`);
    
    // In danh sách loại xét nghiệm
    const catMap = {};
    cases.forEach(c => {
      catMap[c.loaiXetNghiem] = (catMap[c.loaiXetNghiem] || 0) + 1;
    });
    console.log('   Chi tiết dịch vụ:', catMap);
  }

  await mongoose.disconnect();
}
testQuery();
