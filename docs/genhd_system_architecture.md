# Tài Liệu Bóc Tách Hệ Thống Xét Nghiệm GenHD (genhd.genetrust.vn)

> **Mục đích:** Tài liệu kỹ thuật lưu trữ toàn bộ cấu trúc kiến trúc, mô hình dữ liệu, danh mục xét nghiệm và luồng nghiệp vụ thực tế bóc tách từ hệ thống GenHD để phục vụ việc xây dựng dự án **`bio-result`**.

---

## 1. Tổng Quan Kiến Trúc Công Nghệ

| Thành phần | Công nghệ thực tế của GenHD | Ánh xạ sang dự án Bio-Result |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router, Turbopack, React 19) | Next.js (`bio-result-frontend`) |
| **UI / Styling** | Tailwind CSS + Lucide Icons + `react-hot-toast` | Tailwind CSS + Lucide Icons |
| **Backend** | Next.js Route Handlers (`/api/...`) | **NestJS REST API** (`bio-result-backend`) |
| **Xác thực** | NextAuth (Credentials Strategy) | JWT + Passport (`bio-result-backend/auth`) |
| **Cơ sở dữ liệu**| MongoDB Mongoose | **MongoDB Mongoose** (`bio-result-backend`) |
| **Xuất PDF** | Template PDF động (`/export-pdf`) | PDFKit / pdf-lib / Puppeteer |

---

## 2. Danh Mục 15 Gói Dịch Vụ Xét Nghiệm

Hệ thống quản lý 15 mã gói xét nghiệm (`category` / `loaiXetNghiem`):

1. `cell`: Xét nghiệm Cell (Tế bào học)
2. `thinprep`: Xét nghiệm ThinPrep (Tế bào học cổ tử cung nhúng dịch)
3. `hpv20`: Xét nghiệm HPV định tuýp 20 chủng
4. `hpv23`: Xét nghiệm HPV định tuýp 23 chủng
5. `hpv40`: Xét nghiệm HPV định tuýp 40 chủng
6. `soituoi`: Xét nghiệm Soi tươi vi sinh (nấm, trùng roi, tạp khuẩn)
7. `giaiphaubenh`: Giải Phẫu Bệnh (mô bệnh học, sinh thiết)
8. `combo_hpv20_cell`: Combo HPV 20 + Cell
9. `combo_hpv40_cell`: Combo HPV 40 + Cell
10. `combo_hpv23_cell`: Combo HPV 23 + Cell
11. `combo_hpv20_thinprep`: Combo HPV 20 + ThinPrep
12. `combo_hpv40_thinprep`: Combo HPV 40 + ThinPrep
13. `combo_hpv23_thinprep`: Combo HPV 23 + ThinPrep
14. `adn-convert`: Xét nghiệm ADN huyết thống
15. `dashboard`: Trung tâm Báo cáo & Thống kê

---

## 3. Ma Trận Phân Quyền (RBAC)

| Nhóm Tài Khoản | Đại diện thực tế | Quyền hạn và giới hạn |
| :--- | :--- | :--- |
| **Lab / Đơn vị gửi mẫu** | `bv_đhqg`, `ninhbinh`, `lab 24/7` | - Nhập thông tin hành chính của ca xét nghiệm mới.<br>- Chỉ định bác sĩ mong muốn đọc kết quả (`bacSiDoc`).<br>- Xem danh sách các ca của riêng đơn vị mình gửi. |
| **Bác sĩ đọc KQ (Doctor)** | `bacsi_hùng`, `bacsi_trực`, `bacsi_đương` | - **Chỉ đọc và chẩn đoán**.<br>- Hệ thống tự động lọc chỉ hiển thị các ca được phân công cho bác sĩ đó.<br>- Nhập kết quả chuyên môn (hình thái tế bào, kết quả HPV, chẩn đoán vi thể/đại thể).<br>- Ký duyệt chuyên môn (`daKy = true`). |
| **Admin Lab (Quản trị)** | `admin_lab` | - Toàn quyền trên mọi gói xét nghiệm và đơn vị.<br>- Điều phối/đổi bác sĩ đọc đơn.<br>- Duyệt lần cuối và kích hoạt **Trả kết quả** (`da_tra_ket_qua`).<br>- Tải và xuất file PDF kết quả. |

---

## 4. Chi Tiết Schema Cơ Sở Dữ Liệu (`TestResult` / `BioCase`)

```typescript
export interface BioCaseSchema {
  _id: string;
  maSo: string;              // Mã phiếu barcode: ví dụ "GTHD-CB23TP022"
  loaiXetNghiem: string;     // Mã gói (thinprep, hpv40, combo...)
  
  // Thông tin hành chính
  hoTen: string;
  namSinh: number;
  gioiTinh: 'Nam' | 'Nữ' | 'Khác';
  soDienThoai: string;
  diaChi: string;
  loaiMau: string;           // Dịch phết tế bào, mô sinh thiết...
  donVi: string;             // Tên bệnh viện / phòng khám gửi mẫu
  bacSiChiDinh: string;      // Bác sĩ khám lâm sàng
  chanDoanLamSang: string;   // Chẩn đoán ban đầu của phòng khám
  
  // Thời gian & người xử lý
  nguoiNhap: string;
  ngayNhanMau: string;
  ngayXetNghiem: string;
  ngayDuKienTra: string;
  ngayTraKetQua: string;
  
  // Chỉ số tế bào học (Cytology / ThinPrep / Cell / GPB)
  viTriBenhPham: string;
  tinhChatBenhPham: string;  // "Đạt yêu cầu" | "Không đạt"
  lyDoKhongDat: string;
  daiThe: string;            // Mô tả đại thể
  viThe: string;             // Mô tả vi thể
  nhanXetDaiThe: string;
  khongTonThuong: string;    // NILM
  bienDoiViSinh: string;     // Nấm, trùng roi, trực khuẩn
  bienDoiKhac: string;       // Viêm, biến đổi phản ứng
  batThuongVay: string;      // ASC-US, ASC-H, LSIL, HSIL, SCC
  batThuongTuyen: string;    // AGC, AIS, Ung thư biểu mô tuyến
  batThuongKhac: string;
  
  // Chỉ số HPV
  hpvHighRiskResult: string;      // Type 16, 18
  hpvHighRiskOtherResult: string; // Type 31, 33, 35, 39, 45, 51, 52, 56, 58, 59, 68
  hpvLowRiskResult: string;       // Type 6, 11
  hpvOtherTypesResult: string;
  hienBieuDo: boolean;            // Tùy chọn in biểu đồ trên PDF
  anhHpv: string;                 // URL hình ảnh kết quả máy chạy
  
  // Kết luận & Phê duyệt
  ketLuan: string;
  ketLuan2: string;
  khuyenNghi: string;
  bacSiDoc: string;          // Bác sĩ đọc 1
  bacSiDoc2: string;         // Bác sĩ đọc 2 (nếu có)
  daKy: boolean;             // Bác sĩ 1 đã ký
  daKy2: boolean;            // Bác sĩ 2 đã ký
  
  // Trạng thái phiếu
  trangThai: 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua';
  
  // Audit log
  lichSuChinhSua: Array<{
    nguoiSua: string;
    thoiGian: string;
    noiDung: string;
  }>;
}
```

---

## 5. Vòng Đời Trạng Thái (Status Workflow)

1. **`nhap_thong_tin`**:
   - Cho phép: Sửa thông tin phiếu, Xóa phiếu.
   - Thao tác: Bấm nút tiếp nhận (`POST /api/test-results/:id/accept`) để chuyển sang chạy kết quả.
2. **`chay_ket_qua`**:
   - Bác sĩ vào trang `/results/:id` để nhập các chỉ số kết quả, chẩn đoán và bấm **"Duyệt & Ký"**.
3. **`da_tra_ket_qua`**:
   - Khóa chỉnh sửa thông tin.
   - Kích hoạt nút **"Tải kết quả (PDF)"** mở đường dẫn `/api/test-results/:id/export-pdf`.
