import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const targetUsernames = ['bacsi_lanh'];
  const docRegex = /Nguyễn Sỹ Lánh/i;

  const conditions = [{
    $or: [
      { bacSiDocUsername: { $in: targetUsernames } },
      { bacSiDoc2Username: { $in: targetUsernames } },
      {
        $and: [
          { $or: [{ bacSiDocUsername: { $in: [null, '', undefined] } }, { bacSiDocUsername: { $exists: false } }] },
          { $or: [{ bacSiDoc: docRegex }, { bacSiDoc2: docRegex }, { doctorName: docRegex }] }
        ]
      }
    ]
  }];

  const query = { $and: conditions };
  const res = await db.collection('biocases').find(query).toArray();
  console.log('Query result count for bacsi_lanh:', res.length);

  const targetUsernames2 = ['bacsi_lanh2'];
  const conditions2 = [{
    $or: [
      { bacSiDocUsername: { $in: targetUsernames2 } },
      { bacSiDoc2Username: { $in: targetUsernames2 } },
    ]
  }];
  const res2 = await db.collection('biocases').find({ $and: conditions2 }).toArray();
  console.log('Query result count for bacsi_lanh2:', res2.length);

  await mongoose.disconnect();
}
run();
