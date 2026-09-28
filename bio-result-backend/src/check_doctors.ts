import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const users = await mongoose.connection.collection('users').find({
    role: { $in: ['doctor', 'bacsy'] }
  }).toArray();
  console.log(JSON.stringify(users.map(u => ({
    username: u.username,
    fullName: u.fullName,
    title: u.title,
    signatureUrl: u.signatureUrl
  })), null, 2));
  await mongoose.disconnect();
}
run();
