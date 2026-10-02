import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const allCases = await db.collection('biocases').find({}).project({
    maSo: 1, hoTen: 1, loaiXetNghiem: 1, bacSiDoc: 1, bacSiDoc2: 1, bacSiDocUsername: 1
  }).toArray();

  console.log('TOTAL CASES:', allCases.length);
  const doctorCounts = {};
  allCases.forEach(c => {
    const key = `BS1: [${c.bacSiDoc}] | BS2: [${c.bacSiDoc2 || ''}]`;
    doctorCounts[key] = (doctorCounts[key] || 0) + 1;
  });
  console.log('DOCTOR BREAKDOWN:', doctorCounts);

  await mongoose.disconnect();
}
run();
