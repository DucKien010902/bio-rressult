import mongoose from 'mongoose';

const MONGO_URI_MAIN = 'mongodb+srv://DucKien:kien010902@cluster0.4l1lzw3.mongodb.net/bio-result?retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  await mongoose.connect(MONGO_URI_MAIN);
  const db = mongoose.connection.db;

  const userDocs = await db.collection('users').find({ role: { $in: ['doctor', 'bacsy'] } }).toArray();
  const doctorDocs = await db.collection('doctors').find({}).toArray();

  const userLabs = await db.collection('users').find({ role: 'lab' }).toArray();
  const sourceDocs = await db.collection('sources').find({}).toArray();

  const allUsers = await db.collection('users').find({}).toArray();

  console.log('=== DATABASE: bio-result (MAIN) ===');
  console.log('TOTAL USERS COUNT:', allUsers.length);
  console.log('USERS (ROLE DOCTOR) Count:', userDocs.length);
  console.table(userDocs.map(u => ({ username: u.username, fullName: u.fullName, doctorId: u.doctorId })));

  console.log('DOCTORS COLLECTION Count:', doctorDocs.length);
  console.table(doctorDocs.map(d => ({ code: d.code, fullName: d.fullName, userId: d.userId })));

  console.log('USERS (ROLE LAB) Count:', userLabs.length);
  console.table(userLabs.map(u => ({ username: u.username, fullName: u.fullName, donVi: u.donVi, sourceId: u.sourceId })));

  console.log('SOURCES COLLECTION Count:', sourceDocs.length);
  console.table(sourceDocs.map(s => ({ code: s.code, fullName: s.fullName, donVi: s.donVi, userId: s.userId })));

  await mongoose.disconnect();
}
test().catch(console.error);
