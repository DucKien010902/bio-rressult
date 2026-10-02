import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function sim() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const doctor = 'bacsi_lanh';
  const targetUsernames = new Set();
  targetUsernames.add(doctor.toLowerCase());

  const doc = await db.collection('doctors').findOne({ code: 'bacsi_lanh' });
  if (doc?.code) targetUsernames.add(doc.code.toLowerCase());

  const rawName = doc?.fullName || doctor;
  const escapedRaw = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
  const coreName = rawName.replace(/^(TS|BS|ThS|BSCK1|BS\s*CK1|BSNT|ThS\.\s*BSNT|\.|\s)+/gi, '').trim();
  const escapedCore = coreName.length >= 3 ? coreName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*') : escapedRaw;
  const docRegex = new RegExp('(' + escapedRaw + '|' + escapedCore + ')', 'i');

  const conditions = [{
    $or: [
      { bacSiDocUsername: { $in: Array.from(targetUsernames) } },
      { bacSiDoc2Username: { $in: Array.from(targetUsernames) } },
      {
        $and: [
          { $or: [{ bacSiDocUsername: { $in: [null, '', undefined] } }, { bacSiDocUsername: { $exists: false } }] },
          { $or: [{ bacSiDoc: docRegex }, { bacSiDoc2: docRegex }, { doctorName: docRegex }] }
        ]
      }
    ]
  }];

  const cases = await db.collection('biocases').find({ $and: conditions }).toArray();
  console.log('Query result count for bacsi_lanh:', cases.length);

  const hasCell401 = cases.some(c => c.maSo === 'GTHD-CELL-401');
  console.log('Does it contain GTHD-CELL-401?', hasCell401);

  await mongoose.disconnect();
}
sim();
