import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const login1 = await fetch('http://localhost:5003/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bacsi_lanh', password: '123456' })
  });
  const auth1 = await login1.json();
  console.log('Auth1 user:', auth1.user);

  const resAll = await fetch('http://localhost:5003/api/cases', {
    headers: { Authorization: 'Bearer ' + auth1.accessToken }
  });
  const cases = await resAll.json();
  console.log('Cases received count:', cases.length);
  if (cases.length > 0) {
    console.log('Cases sample:', cases.slice(0, 3).map(c => ({ maSo: c.maSo, loai: c.loaiXetNghiem, doc: c.bacSiDoc, docU: c.bacSiDocUsername })));
  }

  // Also test with category=giaiphaubenh
  const resGpb = await fetch('http://localhost:5003/api/cases?category=giaiphaubenh', {
    headers: { Authorization: 'Bearer ' + auth1.accessToken }
  });
  const casesGpb = await resGpb.json();
  console.log('Cases GPB count:', casesGpb.length);
}
test();
