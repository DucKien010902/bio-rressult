import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://DucKien:kien010902@cluster0.4l1lzw3.mongodb.net/bio-result?retryWrites=true&w=majority&appName=Cluster0';

async function runSync() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  console.log('--- SYNCING DOCTORS ---');
  const userDocs = await db.collection('users').find({ role: { $in: ['doctor', 'bacsy'] } }).toArray();
  for (const uDoc of userDocs) {
    let doctor = uDoc.doctorId ? await db.collection('doctors').findOne({ _id: uDoc.doctorId }) : null;
    if (!doctor) {
      doctor = await db.collection('doctors').findOne({ code: uDoc.username });
    }
    if (!doctor) {
      const res = await db.collection('doctors').insertOne({
        code: uDoc.username,
        fullName: uDoc.fullName || uDoc.username,
        title: uDoc.title || '',
        donVi: uDoc.donVi || '',
        soDienThoai: uDoc.soDienThoai || '',
        email: uDoc.email || '',
        signatureUrl: uDoc.signatureUrl || '',
        allowedCategories: uDoc.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'hpv24', 'soituoi', 'giaiphaubenh', 'giaiphaubenh_mobenh', 'giaiphaubenh_tebaohoc'],
        userId: uDoc._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const doctorId = res.insertedId;
      await db.collection('users').updateOne({ _id: uDoc._id }, { $set: { doctorId } });
      console.log(`[+] Created Doctor record for username '${uDoc.username}' (${uDoc.fullName})`);
    } else {
      await db.collection('users').updateOne({ _id: uDoc._id }, { $set: { doctorId: doctor._id } });
      await db.collection('doctors').updateOne({ _id: doctor._id }, { $set: { userId: uDoc._id } });
      console.log(`[=] Linked Doctor '${doctor.fullName}' (${doctor.code}) with User '${uDoc.username}'`);
    }
  }

  console.log('--- SYNCING SOURCES ---');
  const userLabs = await db.collection('users').find({ role: 'lab' }).toArray();
  for (const uSrc of userLabs) {
    let source = uSrc.sourceId ? await db.collection('sources').findOne({ _id: uSrc.sourceId }) : null;
    if (!source) {
      source = await db.collection('sources').findOne({ code: uSrc.username });
    }
    if (!source) {
      const res = await db.collection('sources').insertOne({
        code: uSrc.username,
        fullName: uSrc.fullName || uSrc.username,
        donVi: uSrc.donVi || uSrc.fullName || uSrc.username,
        soDienThoai: uSrc.soDienThoai || '',
        email: uSrc.email || '',
        diaChi: uSrc.diaChi || '',
        allowedCategories: uSrc.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'hpv24', 'soituoi', 'giaiphaubenh', 'giaiphaubenh_mobenh', 'giaiphaubenh_tebaohoc'],
        userId: uSrc._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const sourceId = res.insertedId;
      await db.collection('users').updateOne({ _id: uSrc._id }, { $set: { sourceId } });
      console.log(`[+] Created Source record for username '${uSrc.username}' (${uSrc.fullName})`);
    } else {
      await db.collection('users').updateOne({ _id: uSrc._id }, { $set: { sourceId: source._id } });
      await db.collection('sources').updateOne({ _id: source._id }, { $set: { userId: uSrc._id } });
      console.log(`[=] Linked Source '${source.fullName}' (${source.code}) with User '${uSrc.username}'`);
    }
  }

  console.log('=== VERIFYING FINAL COUNTS ===');
  const finalDoctorsCount = await db.collection('doctors').countDocuments();
  const finalDoctorUsersCount = await db.collection('users').countDocuments({ role: { $in: ['doctor', 'bacsy'] } });

  const finalSourcesCount = await db.collection('sources').countDocuments();
  const finalSourceUsersCount = await db.collection('users').countDocuments({ role: 'lab' });

  console.log(`DOCTORS: ${finalDoctorsCount} records (Users role doctor: ${finalDoctorUsersCount})`);
  console.log(`SOURCES: ${finalSourcesCount} records (Users role lab: ${finalSourceUsersCount})`);

  await mongoose.disconnect();
}

runSync().catch(console.error);
