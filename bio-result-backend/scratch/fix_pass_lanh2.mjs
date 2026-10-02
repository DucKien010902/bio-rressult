import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const newPass = await bcrypt.hash('123456', 10);
  await db.collection('users').updateOne({ username: 'bacsi_lanh2' }, { $set: { password: newPass, passwordHint: '123456' } });
  console.log('Password for bacsi_lanh2 set to 123456 successfully!');
  await mongoose.disconnect();
}
fix();
