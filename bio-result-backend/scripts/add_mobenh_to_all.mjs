import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing in .env!');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;

  // 1. Update doctors
  const docRes = await db.collection('doctors').updateMany(
    {},
    { $addToSet: { allowedCategories: 'giaiphaubenh_mobenh' } }
  );
  console.log(`Updated doctors: matched ${docRes.matchedCount}, modified ${docRes.modifiedCount}`);

  // 2. Update sources
  const srcRes = await db.collection('sources').updateMany(
    {},
    { $addToSet: { allowedCategories: 'giaiphaubenh_mobenh' } }
  );
  console.log(`Updated sources: matched ${srcRes.matchedCount}, modified ${srcRes.modifiedCount}`);

  // 3. Update users
  const userRes = await db.collection('users').updateMany(
    {},
    { $addToSet: { allowedCategories: 'giaiphaubenh_mobenh' } }
  );
  console.log(`Updated users: matched ${userRes.matchedCount}, modified ${userRes.modifiedCount}`);

  // 4. Update turnaround_time setting if present
  const setting = await db.collection('settings').findOne({ key: 'turnaround_time' });
  if (setting && setting.value) {
    await db.collection('settings').updateOne(
      { key: 'turnaround_time' },
      { $set: { 'value.giaiphaubenh_mobenh': 72 } }
    );
    console.log('Updated turnaround_time setting with giaiphaubenh_mobenh: 72.');
  }

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(console.error);
