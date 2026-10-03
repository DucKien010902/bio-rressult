import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkBS2() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const bs2Lanh = await db.collection('biocases').find({
    $or: [{ bacSiDoc2Username: 'bacsi_lanh' }, { bacSiDoc2Username: 'bacsi_lanh2' }]
  }).project({ maSo: 1, loaiXetNghiem: 1, bacSiDoc: 1, bacSiDocUsername: 1, bacSiDoc2: 1, bacSiDoc2Username: 1 }).toArray();

  console.log('Tổng số ca có BS2 là bacsi_lanh hoặc bacsi_lanh2:', bs2Lanh.length);
  bs2Lanh.forEach(c => {
    console.log(`${c.maSo} | ${c.loaiXetNghiem} | BS1: ${c.bacSiDocUsername} (${c.bacSiDoc}) | BS2: ${c.bacSiDoc2Username} (${c.bacSiDoc2})`);
  });

  await mongoose.disconnect();
}
checkBS2().catch(console.error);
