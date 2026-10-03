import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function debugPdf() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // Tìm 1 ca tế bào/cell của bacsi_lanh2 đã ký
  const caseItem = await db.collection('biocases').findOne({
    $or: [{ bacSiDocUsername: 'bacsi_lanh2' }, { bacSiDoc2Username: 'bacsi_lanh2' }],
    $and: [{ $or: [{ daKy: true }, { daKy2: true }] }]
  });

  console.log('=== CASE ITEM ===');
  if (!caseItem) {
    console.log('Không tìm thấy ca nào đã ký của bacsi_lanh2!');
    await mongoose.disconnect();
    return;
  }

  console.log({
    _id: caseItem._id,
    maSo: caseItem.maSo,
    loaiXetNghiem: caseItem.loaiXetNghiem,
    bacSiDoc: caseItem.bacSiDoc,
    bacSiDocUsername: caseItem.bacSiDocUsername,
    bacSiDoc2: caseItem.bacSiDoc2,
    bacSiDoc2Username: caseItem.bacSiDoc2Username,
    daKy: caseItem.daKy,
    daKy2: caseItem.daKy2
  });

  // Kiểm tra Doctor lookup
  const docLanh2 = await db.collection('doctors').findOne({ code: 'bacsi_lanh2' });
  console.log('\n=== DOCTOR RECORD (bacsi_lanh2) ===');
  console.log(docLanh2);

  // Kiểm tra MinIO URL
  const sigUrl = docLanh2?.signatureUrl;
  console.log('\n=== TESTING SIGNATURE URL ===', sigUrl);

  if (sigUrl) {
    try {
      const res = await fetch(sigUrl);
      console.log('Fetch status:', res.status);
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      console.log('Buffer size:', buf.length, 'bytes');
      console.log('Magic bytes:', buf.slice(0, 4));
    } catch (e) {
      console.error('Fetch signature URL error:', e.message);
    }
  }

  await mongoose.disconnect();
}

debugPdf().catch(console.error);
