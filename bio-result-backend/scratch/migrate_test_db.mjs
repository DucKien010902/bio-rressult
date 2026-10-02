import mongoose from 'mongoose';

async function migrateTestDb() {
  const uri = 'mongodb+srv://DucKien:kien010902@cluster0.4l1lzw3.mongodb.net/bio-result-test?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('--- ĐANG CHUẨN HÓA DỮ LIỆU BÁC SĨ TRÊN BIO-RESULT-TEST ---');

  // Đảm bảo bacsi_lanh2 tồn tại trong users và doctors trên bio-result-test
  let lanh2Doc = await db.collection('doctors').findOne({ code: 'bacsi_lanh2' });
  if (!lanh2Doc) {
    const res = await db.collection('doctors').insertOne({
      code: 'bacsi_lanh2',
      fullName: 'TS.BS NGUYỄN SỸ LÁNH',
      title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
      donVi: 'Khoa Xét Nghiệm & Tế Bào',
      signatureUrl: 'https://file.gennovax.vn/genhd/signatures/doctor_bacsi_lanh2_1790649780007.jpg',
      allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'combo_hpv20_cell', 'combo_hpv40_cell', 'combo_hpv23_cell', 'combo_hpv20_thinprep', 'combo_hpv40_thinprep', 'combo_hpv23_thinprep', 'hpv24'],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    lanh2Doc = { _id: res.insertedId, code: 'bacsi_lanh2', fullName: 'TS.BS NGUYỄN SỸ LÁNH' };
    console.log('Đã tạo doctor bacsi_lanh2 trên bio-result-test');
  }

  let lanh2User = await db.collection('users').findOne({ username: 'bacsi_lanh2' });
  if (!lanh2User) {
    import('bcrypt').then(async (bcrypt) => {
      const pass = await bcrypt.default.hash('123456', 10);
      await db.collection('users').insertOne({
        username: 'bacsi_lanh2',
        password: pass,
        passwordHint: '123456',
        fullName: 'TS.BS NGUYỄN SỸ LÁNH',
        role: 'doctor',
        title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
        donVi: 'Khoa Xét Nghiệm & Tế Bào',
        allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'combo_hpv20_cell', 'combo_hpv40_cell', 'combo_hpv23_cell', 'combo_hpv20_thinprep', 'combo_hpv40_thinprep', 'combo_hpv23_thinprep', 'hpv24'],
        isActive: true,
        doctorId: lanh2Doc._id
      });
      console.log('Đã tạo user bacsi_lanh2 trên bio-result-test');
    });
  }

  const doctors = await db.collection('doctors').find({}).toArray();
  const docMap = {};
  doctors.forEach(d => {
    docMap[d.code] = { id: String(d._id), code: d.code, fullName: d.fullName };
  });

  // 1. Cập nhật các ca GPB -> bacsi_lanh
  const r1 = await db.collection('biocases').updateMany(
    { loaiXetNghiem: { $in: ['giaiphaubenh', 'giaiphaubenh_mobenh', 'giaiphaubenh_tebaohoc'] } },
    { $set: { bacSiDocUsername: 'bacsi_lanh', bacSiDocId: docMap['bacsi_lanh']?.id, bacSiDoc2Username: 'bacsi_lanh', bacSiDoc2Id: docMap['bacsi_lanh']?.id } }
  );
  console.log('GPB cases mapped to bacsi_lanh:', r1.modifiedCount);

  // 2. Cập nhật các ca Tế bào (Cell / ThinPrep / Soi tươi) -> bacsi_lanh2
  const r2 = await db.collection('biocases').updateMany(
    { loaiXetNghiem: { $in: ['cell', 'thinprep', 'soituoi'] } },
    { $set: { bacSiDoc: 'TS.BS NGUYỄN SỸ LÁNH', bacSiDocUsername: 'bacsi_lanh2', bacSiDocId: docMap['bacsi_lanh2']?.id, bacSiDoc2: 'TS.BS NGUYỄN SỸ LÁNH', bacSiDoc2Username: 'bacsi_lanh2', bacSiDoc2Id: docMap['bacsi_lanh2']?.id } }
  );
  console.log('Cell/Thinprep/Soituoi cases mapped to bacsi_lanh2:', r2.modifiedCount);

  // 3. Cập nhật các ca Combo: BS1 là bacsi_hung (HPV), BS2 là bacsi_lanh2 (Tế bào)
  const r3 = await db.collection('biocases').updateMany(
    { loaiXetNghiem: { $regex: /^combo_/ } },
    {
      $set: {
        bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
        bacSiDocUsername: 'bacsi_hung',
        bacSiDocId: docMap['bacsi_hung']?.id,
        bacSiDoc2: 'TS.BS NGUYỄN SỸ LÁNH',
        bacSiDoc2Username: 'bacsi_lanh2',
        bacSiDoc2Id: docMap['bacsi_lanh2']?.id
      }
    }
  );
  console.log('Combo cases mapped: BS1=bacsi_hung, BS2=bacsi_lanh2:', r3.modifiedCount);

  // 4. Cập nhật các ca HPV đơn lẻ
  const r4 = await db.collection('biocases').updateMany(
    { loaiXetNghiem: { $in: ['hpv20', 'hpv23', 'hpv24', 'hpv40'] } },
    { $set: { bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG', bacSiDocUsername: 'bacsi_hung', bacSiDocId: docMap['bacsi_hung']?.id, bacSiDoc2: 'BS CK1 PHẠM THẾ HÙNG', bacSiDoc2Username: 'bacsi_hung', bacSiDoc2Id: docMap['bacsi_hung']?.id } }
  );
  console.log('HPV standalone cases mapped to bacsi_hung:', r4.modifiedCount);

  const cLanh = await db.collection('biocases').countDocuments({
    $or: [{ bacSiDocUsername: 'bacsi_lanh' }, { bacSiDoc2Username: 'bacsi_lanh' }]
  });
  const cLanh2 = await db.collection('biocases').countDocuments({
    $or: [{ bacSiDocUsername: 'bacsi_lanh2' }, { bacSiDoc2Username: 'bacsi_lanh2' }]
  });
  console.log(`\n=> BIO-RESULT-TEST STATS:`);
  console.log(`- bacsi_lanh: ${cLanh} ca`);
  console.log(`- bacsi_lanh2: ${cLanh2} ca (bao gồm cả các ca Combo đọc phần 2)`);

  await mongoose.disconnect();
}

migrateTestDb().catch(console.error);
