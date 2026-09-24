# BÍ KÍP ĐIỀN DỮ LIỆU CHUẨN XÁC VÀO CÁC MẪU PDF TRẮNG (PIXEL-PERFECT PDF FILLING)

Tài liệu này lưu lại phương pháp chuẩn đã được chứng minh thành công trên mẫu **HPV 20 Types** để áp dụng cho tất cả các mẫu PDF xét nghiệm khác (HPV 40, HPV 23, ThinPrep, Cell, Soi tươi, Giải phẫu bệnh, Combo).

---

## 1. NGUYÊN TẮC CỐT LÕI (4 NGUYÊN TẮC VÀNG)

1. **KHÔNG DÙNG NỀN TRẮNG (NO WHITEOUT OVERLAY):**
   - Không dùng `pg.drawRectangle` màu trắng phủ lên dữ liệu trừ khi cần xóa các dấu chấm sẵn (`.....`).
   - Vẽ chữ trực tiếp (transparent) để bảo toàn 100% hình nền chìm (watermark logo) của viện/phòng lab.

2. **TRÍCH XUẤT TỌA ĐỘ TỪ LUỒNG VECTOR GỐC (VECTOR STREAM EXTRACTION):**
   - Không ước lượng tọa độ bằng mắt.
   - Dùng script giải nén stream PDF để lấy chính xác từng tọa độ đường kẻ dọc, đường kẻ ngang và baseline (đường chân chữ) của nhãn in sẵn.

3. **CĂN LỀ ĐỐI XỨNG & THỤT LỀ CỐ ĐỊNH (SYMMETRIC COLUMN PADDING):**
   - Xác định đường kẻ dọc phân cách nhãn và ô giá trị.
   - Thụt lề thêm một khoảng đệm cố định (ví dụ `+10pt`) cho cả 2 bên cột trái và cột phải để dữ liệu căn trái thẳng tắp và cân bằng.

4. **CĂN GIỮA ĐỘNG CHO CỘT KẾT QUẢ (DYNAMIC COLUMN CENTERING):**
   - Đo chiều rộng chữ thực tế: `width = font.widthOfTextAtSize(text, size)`.
   - Vị trí X căn giữa: `x = minX + (maxX - minX - width) / 2`.

---

## 2. QUY TRÌNH 4 BƯỚC TRIỂN KHAI CHO MẪU MỚI

### Bước 1: Trích xuất tọa độ vách ngăn cột (Vertical Lines)
Dùng đoạn mã Node.js sau để tìm tất cả các đường kẻ dọc trong bảng:

```javascript
const fs = require('fs');
const zlib = require('zlib');

function findVerticalLines(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  const str = buf.toString('binary');
  const regex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;

  while ((match = regex.exec(str)) !== null) {
    try {
      const dec = zlib.inflateSync(Buffer.from(match[1], 'binary')).toString('utf8');
      const lines = dec.split('\n');
      for (const line of lines) {
        const m = line.trim().match(/([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+re/);
        if (m && parseFloat(m[4]) > 10 && parseFloat(m[3]) < 2) {
          console.log(`Đường kẻ dọc: X=${parseFloat(m[1]).toFixed(2)}, Y=${parseFloat(m[2]).toFixed(2)}, H=${parseFloat(m[4]).toFixed(2)}`);
        }
      }
    } catch(e) {}
  }
}
```

### Bước 2: Trích xuất baseline chữ của các nhãn in sẵn (Baseline Y)
Dùng PyMuPDF (hoặc pdfjs-dist) đọc từng span để lấy `Baseline_Y` và nhãn:

```python
import pymupdf
doc = pymupdf.open('templates/ten_mau_moi.pdf')
page = doc[0]
h = page.rect.height
for b in page.get_text('dict')['blocks']:
    if b.get('type') == 0:
        for line in b['lines']:
            for s in line['spans']:
                text = s['text'].strip()
                if text:
                    baseline_y = h - s['origin'][1]
                    print(f"X={s['bbox'][0]:.1f}, Baseline_Y={baseline_y:.1f}, Size={s['size']:.1f}: '{text}'")
```

### Bước 3: Xác định tọa độ chuẩn
- **Cột trái:**
  - Vách ngăn nhãn - giá trị: `X_divider_left`
  - Tọa độ đổ chữ cột trái: `X_LEFT = X_divider_left + 10`
- **Cột phải:**
  - Vách ngăn nhãn - giá trị: `X_divider_right`
  - Tọa độ đổ chữ cột phải: `X_RIGHT = X_divider_right + 10`
- **Cột Kết quả:**
  - Vách trái cột kết quả: `colMinX`
  - Vách phải cột kết quả: `colMaxX`
  - Tọa độ X căn giữa: `colMinX + (colMaxX - colMinX - width) / 2`
  - Baseline Y của từng hàng: lấy đúng `Baseline_Y` của loại test đó.

### Bước 4: Viết hàm đổ chữ trong suốt vào PDF Service

```typescript
// 1. Hàm vẽ text không có nền trắng
const drawText = (text: string, x: number, y: number, opt: any = {}) => {
  if (!text) return;
  const font = opt.bold ? fontB : fontR;
  const size = opt.size || 9.0;
  const color = opt.color || textColor;
  pg.drawText(String(text), { x, y, size, font, color });
};

// 2. Hàm căn giữa cột
const drawCentered = (text: string, minX: number, maxX: number, y: number, opt: any = {}) => {
  if (!text) return;
  const font = opt.bold ? fontB : fontR;
  const size = opt.size || 9.5;
  const color = opt.color || textColor;
  const width = font.widthOfTextAtSize(String(text), size);
  const x = minX + (maxX - minX - width) / 2;
  pg.drawText(String(text), { x, y, size, font, color });
};
```

---

## 3. BẢNG TỌA ĐỘ CHUẨN CỦA MẪU HPV 20 (THAM KHẢO)

| Trường thông tin | Vị trí X | Baseline Y | Kiểu chữ | Màu sắc | Ghi chú |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Mã bệnh nhân** | `137.5` | `692.6` | Bold 9.5 | Đen đậm | Cột trái |
| **Họ và tên** | `399.5` | `692.6` | Bold UPPER 9.5 | Đen đậm | Cột phải |
| **Năm sinh** | `137.5` | `673.6` | Regular 9.0 | Đen | Cột trái |
| **Giới tính** | `399.5` | `673.6` | Regular 9.0 | Đen | Cột phải |
| **Địa chỉ** | `137.5` | `654.7` | Regular 8.5 | Đen | Cột trái (dài) |
| **Điện thoại** | `137.5` | `635.7` | Regular 9.0 | Đen | Cột trái |
| **Bác sĩ chỉ định**| `399.5` | `635.7` | Regular 9.0 | Đen | Cột phải |
| **Đơn vị gửi mẫu**| `137.5` | `616.7` | Regular 9.0 | Đen | Cột trái |
| **Loại mẫu** | - | - | - | - | Giữ nguyên chữ "Dịch" in sẵn |
| **Ngày nhận mẫu** | `137.5` | `549.0` | Regular 9.0 | Đen | Cùng hàng với ngày trả KQ |
| **Ngày trả kết quả**| `399.5` | `549.0` | Regular 9.0 | Đen | Cùng hàng với ngày nhận |
| **HPV Nguy cơ cao**| Căn giữa `455.7 - 560.9` | `459.5` | Bold 9.5 | Xanh / Đỏ | Dương tính: Đỏ, Âm tính: Xanh |
| **Nguy cơ cao khác**| Căn giữa `455.7 - 560.9` | `429.7` | Bold 9.5 | Xanh / Đỏ | Ngang giữa khối 16 type |
| **HPV Nguy cơ thấp**| Căn giữa `455.7 - 560.9` | `399.7` | Bold 9.5 | Xanh / Đỏ | Ngang type 6, 11 |
| **Kết luận** | `115.0` | `262.9` | Bold 9.0 | Xanh đậm | Ngang chữ "KẾT LUẬN:" |
| **Ngày tháng ký** | Căn giữa `350 - 510` | `214.1` | Italic 8.5 | Xám đậm | Xóa dấu chấm: `x:350, y:209, w:170, h:12` |
