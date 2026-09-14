import fs from 'fs';

const content = fs.readFileSync('d:/Tài liệu/HOCTAP/bio-result/scratch/chunk_2x46xhsh4ni7t.js', 'utf-8');

// Find all section titles, headers, form fields
const titles = [
  'Phiếu xét nghiệm',
  'Thông tin hành chính bệnh nhân',
  'KẾT QUẢ XÉT NGHIỆM',
  'NHÓM HPV NGUY CƠ CAO',
  'NHÓM HPV NGUY CƠ THẤP',
  'CÁC TYPE HPV KHÁC',
  'Đính kèm / Tải lên biểu đồ',
  'KẾT LUẬN XÉT NGHIỆM',
  'KHUYẾN NGHỊ / ĐỀ NGHỊ',
  'Bác sĩ đọc kết quả',
  'ĐÃ KÝ DUYỆT',
  'Hủy chữ ký',
  'Lưu kết quả HPV',
  'Lưu thông tin phiếu',
  'Lưu thay đổi',
  'Xem trước PDF',
  'Tải xuống PDF'
];

console.log('--- Matching positions and snippets ---');
for (const title of titles) {
  let idx = content.indexOf(title);
  if (idx !== -1) {
    console.log(`\n=== Found "${title}" at ${idx} ===`);
    console.log(content.slice(Math.max(0, idx - 150), Math.min(content.length, idx + 250)));
  } else {
    console.log(`Not found: "${title}"`);
  }
}
