import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const c = await db.collection('biocases').findOne({ maSo: /924/ });
  console.log('Case 924:', JSON.stringify(c, null, 2));
  await mongoose.disconnect();
}
check();
