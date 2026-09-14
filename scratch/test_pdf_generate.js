import fs from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

async function testGenerate() {
  const pdfBytes = fs.readFileSync('d:/Tài liệu/HOCTAP/bio-result/bio-result-backend/templates/sample_hpv40.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  // Load font Arial
  const fontBytes = fs.readFileSync('C:/Windows/Fonts/arial.ttf');
  const fontBoldBytes = fs.readFileSync('C:/Windows/Fonts/arialbd.ttf');
  const fontRegular = await pdfDoc.embedFont(fontBytes);
  const fontBold = await pdfDoc.embedFont(fontBoldBytes);

  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  console.log('Page size:', width, height);

  // Helper to clear area and write text
  const writeField = (x, y, text, isBold = false, fontSize = 9, clearWidth = 150) => {
    // White out old text
    // Note: y is the baseline of the text. Font height ~ 10-12pt.
    page.drawRectangle({
      x: x - 2,
      y: y - 2,
      width: clearWidth,
      height: fontSize + 4,
      color: rgb(1, 1, 1),
    });

    // Draw new text
    page.drawText(text, {
      x: x,
      y: y,
      size: fontSize,
      font: isBold ? fontBold : fontRegular,
      color: rgb(0, 0, 0),
    });
  };

  // Test data for Vũ Thị Bích Ngọc
  // 1. Mã bệnh nhân: x = 125, y = 699
  writeField(125, 699, 'GTHD-40HP015', true, 9.5, 120);

  // 2. Họ và tên: x = 365, y = 699
  writeField(365, 699, 'VŨ THỊ BÍCH NGỌC', true, 9.5, 200);

  // 3. Năm sinh: x = 125, y = 682
  writeField(125, 682, '1996', false, 9, 60);

  // 4. Giới tính: x = 365, y = 682
  writeField(365, 682, 'Nữ', false, 9, 60);

  // 5. Địa chỉ: x = 125, y = 664
  writeField(125, 664, 'Hai Bà Trưng, Hà Nội', false, 9, 440);

  // 6. Điện thoại: x = 125, y = 647
  writeField(125, 647, '0965123456', false, 9, 120);

  // 7. Bác sĩ chỉ định: x = 385, y = 647
  writeField(385, 647, 'BS. Lê Hoài An', false, 9, 180);

  // 8. Đơn vị gửi mẫu: x = 130, y = 629
  writeField(130, 629, 'Bệnh Viện ĐHQG', false, 9, 430);

  // 9. Loại mẫu: x = 125, y = 612
  writeField(125, 612, 'Dịch phết', false, 9, 150);

  // 10. Ngày nhận mẫu: x = 140, y = 594
  writeField(140, 594, '09/09/2026', false, 9, 100);

  // 11. Ngày trả kết quả: x = 400, y = 594
  writeField(400, 594, '12/09/2026', false, 9, 100);

  // 12. Kết luận: x = 120, y = 256
  writeField(120, 256, 'ÂM TÍNH VỚI VIRUS HPV (40 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.', true, 9, 450);

  // 13. Bác sĩ ký: x = 347, y = 88
  writeField(347, 88, 'TS . BS Nguyễn Khánh Dương', true, 9.5, 200);

  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync('d:/Tài liệu/HOCTAP/bio-result/scratch/test_ngoc.pdf', modifiedPdfBytes);
  console.log('Successfully saved test_ngoc.pdf! Size:', modifiedPdfBytes.length);
}

testGenerate().catch(console.error);
