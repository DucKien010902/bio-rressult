import fs from 'fs';

async function testRender() {
  const baseUrl = 'https://bio-rressult.onrender.com/api';

  console.log('1. Logging in to Render as bacsi_lanh2...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bacsi_lanh2', password: '123456' })
  });

  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Token received:', !!token);

  // 2. Lấy danh sách ca của bacsi_lanh2
  console.log('\n2. Fetching cases from Render...');
  const casesRes = await fetch(`${baseUrl}/cases?limit=10&loaiXetNghiem=cell`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const casesData = await casesRes.json();
  const cases = casesData.cases || casesData.data || [];
  console.log('Found', cases.length, 'cell cases:');

  const lanh2Case = cases.find(c => c.bacSiDocUsername === 'bacsi_lanh2' || (c.bacSiDoc && c.bacSiDoc.includes('NGUYỄN SỸ LÁNH')));
  if (!lanh2Case) {
    console.log('No case found for bacsi_lanh2 on Render!');
    return;
  }
  console.log('Target case on Render:', {
    _id: lanh2Case._id,
    maSo: lanh2Case.maSo,
    bacSiDoc: lanh2Case.bacSiDoc,
    bacSiDocUsername: lanh2Case.bacSiDocUsername,
    daKy: lanh2Case.daKy
  });

  // 3. Export PDF from Render
  console.log('\n3. Downloading PDF from Render for case:', lanh2Case.maSo);
  const pdfRes = await fetch(`${baseUrl}/cases/${lanh2Case._id}/export-pdf`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('PDF response status:', pdfRes.status);
  const pdfBytes = await pdfRes.arrayBuffer();
  console.log('PDF size from Render:', pdfBytes.byteLength, 'bytes');

  fs.writeFileSync('scratch/render_output.pdf', Buffer.from(pdfBytes));
  console.log('Saved to scratch/render_output.pdf');
}

testRender().catch(console.error);
