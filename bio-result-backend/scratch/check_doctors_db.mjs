import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const docs = await db.collection('doctors').find({}).toArray();
  console.log('DOCTORS:', docs.map(d => ({ _id: d._id, code: d.code, fullName: d.fullName, userId: d.userId })));
  const users = await db.collection('users').find({ role: { $in: ['doctor', 'bacsy'] } }).toArray();
  console.log('USERS:', users.map(u => ({ _id: u._id, username: u.username, fullName: u.fullName, doctorId: u.doctorId })));
  const distinctDocs = await db.collection('biocases').distinct('bacSiDoc');
  console.log('DISTINCT bacSiDoc in cases:', distinctDocs);
  const distinctDoc2 = await db.collection('biocases').distinct('bacSiDoc2');
  console.log('DISTINCT bacSiDoc2 in cases:', distinctDoc2);
  await mongoose.disconnect();
}
run();
