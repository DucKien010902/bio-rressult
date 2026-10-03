import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function findCase() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const found = await db.collection('biocases').find({
    $or: [
      { ketLuan: /PHIẾN ĐỒ VIÊM KHÔNG ĐẶC HIỆU MỨC ĐỘ NẶNG/i },
      { 'teBaoHocData.ketLuan': /PHIẾN ĐỒ VIÊM KHÔNG ĐẶC HIỆU MỨC ĐỘ NẶNG/i },
      { 'cellData.ketLuan': /PHIẾN ĐỒ VIÊM KHÔNG ĐẶC HIỆU MỨC ĐỘ NẶNG/i }
    ]
  }).toArray();

  console.log('Tìm thấy:', found.length, 'ca:');
  found.forEach(c => {
    console.log({
      maSo: c.maSo,
      loaiXetNghiem: c.loaiXetNghiem,
      bacSiDoc: c.bacSiDoc,
      bacSiDocUsername: c.bacSiDocUsername,
      bacSiDoc2: c.bacSiDoc2,
      bacSiDoc2Username: c.bacSiDoc2Username,
      daKy: c.daKy,
      daKy2: c.daKy2,
      signatureUrl: c.signatureUrl,
      chuKy: c.chuKy,
      chucDanhDoc: c.chucDanhDoc
    });
  });

  await mongoose.disconnect();
}
findCase().catch(console.error);
