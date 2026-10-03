import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testSig() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const doc2 = await db.collection('doctors').findOne({ code: 'bacsi_lanh2' });
  console.log('Doc2 record:', doc2);

  const sigUrl = doc2?.signatureUrl;
  console.log('Signature URL:', sigUrl);

  if (sigUrl) {
    try {
      console.log('Testing HTTP fetch for signatureUrl...');
      const res = await fetch(sigUrl);
      console.log('HTTP status:', res.status);
      console.log('Content-Type:', res.headers.get('content-type'));
      const arrayBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      console.log('Buffer length:', buf.length);
      console.log('First 10 bytes:', buf.slice(0, 10));
      const isPng = buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const isJpg = buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8;
      console.log('isPng:', isPng, '| isJpg:', isJpg);
    } catch (err) {
      console.error('HTTP fetch failed:', err.message);
    }
  }

  // Also test MinIO service logic
  console.log('\nMinIO Config:');
  console.log({
    endpoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT,
    bucket: process.env.MINIO_BUCKET_NAME,
    publicUrl: process.env.MINIO_PUBLIC_URL
  });

  await mongoose.disconnect();
}

testSig().catch(console.error);
