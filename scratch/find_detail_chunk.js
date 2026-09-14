import fs from 'fs';
import path from 'path';

async function downloadAndInspectChunks() {
  const baseUrl = 'https://genhd.genetrust.vn';
  const chunks = [
    '2cny5exc3vhux.js',
    '0mqpv4jxh0zpl.js',
    '458gsi7ycncy1.js',
    '0gywqv7d5j-af.js',
    '1-8s9_t85wwr4.js',
    '342-ajvt0-w6k.js',
    '3ihcjwq-e206t.js',
    '2x46xhsh4ni7t.js',
    '2whs2_xjn0993.js',
    '0cz1d0mv5g_q7.js',
    '3jvkbm-wxvaor.js'
  ];

  for (const chunk of chunks) {
    const chunkUrl = `${baseUrl}/_next/static/chunks/${chunk}`;
    const res = await fetch(chunkUrl);
    if (res.ok) {
      const text = await res.text();
      const localPath = path.join('d:/Tài liệu/HOCTAP/bio-result/scratch', `chunk_${chunk}`);
      fs.writeFileSync(localPath, text);
      if (text.includes('REAL-TIME PCR') || text.includes('NHÓM HPV') || text.includes('Hủy chữ ký') || text.includes('Xem trước PDF')) {
        console.log(`FOUND DETAIL COMPONENT IN CHUNK: ${chunk}! Length: ${text.length}`);
      }
    }
  }
}

downloadAndInspectChunks().catch(console.error);
