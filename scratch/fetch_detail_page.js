async function fetchResultPage() {
  const baseUrl = 'https://genhd.genetrust.vn';
  const csrfRes = await fetch(baseUrl + '/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const rawCookies = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get('set-cookie')];
  let cookieHeader = rawCookies.map(c => c.split(';')[0]).join('; ');
  const params = new URLSearchParams();
  params.append('csrfToken', csrfData.csrfToken);
  params.append('username', 'admin_lab');
  params.append('password', '210577');
  params.append('redirect', 'false');
  params.append('json', 'true');
  const loginRes = await fetch(baseUrl + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieHeader },
    body: params.toString()
  });
  const loginCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
  const combinedCookies = [...rawCookies, ...loginCookies].map(c => c ? c.split(';')[0] : '').filter(Boolean).join('; ');

  const res = await fetch(baseUrl + '/results/6aa0b89bd9b78698371ae759', {
    headers: { 'Cookie': combinedCookies }
  });
  console.log('Detail page status:', res.status);
  const html = await res.text();
  const fs = await import('fs');
  fs.writeFileSync('d:/Tài liệu/HOCTAP/bio-result/scratch/result_detail_page.html', html);
  console.log('Saved HTML, length:', html.length);

  const scripts = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);
  console.log('Chunks:', scripts);
}

fetchResultPage().catch(console.error);
