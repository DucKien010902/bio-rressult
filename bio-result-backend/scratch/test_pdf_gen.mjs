import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testPdfGen() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const docInfoLanh2 = await db.collection('doctors').findOne({ code: 'bacsi_lanh2' });
  console.log('Lookup code [bacsi_lanh2]:', {
    fullName: docInfoLanh2?.fullName,
    title: docInfoLanh2?.title,
    signatureUrl: docInfoLanh2?.signatureUrl
  });

  const docInfoLanh1 = await db.collection('doctors').findOne({ code: 'bacsi_lanh' });
  console.log('Lookup code [bacsi_lanh]:', {
    fullName: docInfoLanh1?.fullName,
    title: docInfoLanh1?.title,
    signatureUrl: docInfoLanh1?.signatureUrl
  });

  await mongoose.disconnect();
}
testPdfGen().catch(console.error);
