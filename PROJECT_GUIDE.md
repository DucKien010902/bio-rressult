# TÀI LIỆU DỰ ÁN GENTECH (HỆ THỐNG QUẢN LÝ KẾT QUẢ XÉT NGHIỆM)
> **Tài liệu lưu trữ toàn bộ nghiệp vụ, kiến trúc, tài khoản, API và lịch sử trao đổi quan trọng.**
> *Thời gian cập nhật:* 13/09/2026.

---

## 1. TỔNG QUAN HỆ THỐNG
- **Tên dự án:** GENTECH - Medical Lab Test Result Portal.
- **Mục tiêu:** Xây dựng hệ thống portal quản lý quy trình xét nghiệm y khoa (Tế bào học, HPV 40 tuýp, HPV 20 tuýp, ThinPrep, Soi tươi, Giải phẫu bệnh, Combos...) dựa trên mô hình thực tế của hệ thống GenHD/Genetrust, đổi tên thương hiệu sang **Gentech**.
- **Kiến trúc:**
  - **Frontend:** Next.js 16 (App Router, Turbopack, Tailwind CSS, Lucide Icons) tại cổng `3000`.
  - **Backend:** NestJS 12, Mongoose, `@pdf-lib/fontkit`, `pdf-lib` tại cổng `5002`.
  - **Database:** MongoDB Atlas (`cluster0.4l1lzw3.mongodb.net/bio-result`).

---

## 2. TÀI KHOẢN, PHÂN QUYỀN & MẬT KHẨU
Hệ thống thiết lập 3 nhóm vai trò chặt chẽ:

| STT | Tên tài khoản | Mật khẩu | Tên hiển thị | Vai trò (`role`) | Quyền hạn & Nghiệp vụ |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 1 | `admin_lab` | `210577` | Admin phòng Lab | `admin` | **Toàn quyền hệ thống:** Tạo ca, sửa ca, phân công bác sĩ, duyệt trả kết quả (`da_tra_ket_qua`), xóa phiếu, xem Dashboard tổng thể toàn viện. |
| 2 | `bacsi_hùng` | `210577` | BS CK1 PHẠM THẾ HÙNG | `doctor` | **Chỉ có quyền đọc & ký KQ:** Xem ca được giao, nhập kết quả test HPV/Cell, ký tên chẩn đoán. **Không được xóa phiếu**. Dashboard tự động lọc chế độ cá nhân. |
| 3 | `bacsi_đương` | `123456` | TS . BS Nguyễn Khánh Dương | `doctor` | Bác sĩ đọc kết quả (Cell, ThinPrep, GPB, HPV). Không được xóa phiếu. |
| 4 | `bacsi_trực` | `123456` | BSCK1 . Nguyễn Trung Trực | `doctor` | Bác sĩ đọc kết quả (Khoa Tế bào học). |
| 5 | `bacsi_son` | `123456` | ThS. BSNT Trịnh Ngọc Sơn | `doctor` | Bác sĩ đọc kết quả (Giải phẫu bệnh & HPV). |
| 6 | `bv_đhqg` | `123456` | Bệnh Viện Đại Học Quốc Gia | `lab` | **Nhập liệu ban đầu:** Tiếp nhận bệnh nhân, tạo phiếu mới, yêu cầu bác sĩ đọc kết quả. Không ký kết quả y khoa. |
| 7 | `ninhbinh` | `123456` | Bệnh Viện Sản Nhi Ninh Bình | `lab` | Đơn vị gửi mẫu tiếp nhận. |
| 8 | `lab 24/7` | `123456` | Phòng Xét Nghiệm Lab 24/7 | `lab` | Phòng xét nghiệm vệ tinh tiếp nhận mẫu. |

---

## 3. CƠ CHẾ SINH VÀ XỬ LÝ FILE PDF
- **Cơ chế:** **On-the-fly In-Memory Streaming** (`src/cases/pdf.service.ts`).
- **Cách thức hoạt động:**
  - Không lưu trữ hàng trăm ngàn file PDF tĩnh trên VPS/DB (tránh tốn ổ đĩa và rác dữ liệu).
  - Khi người dùng bấm **"Xem lại PDF"** hoặc **"Tải xuống PDF"**, request gọi tới `GET /api/cases/:id/export-pdf`.
  - Backend đọc file mẫu gốc `templates/sample_hpv40.pdf`, phủ các khối che màu trắng chính xác tại tọa độ pixel của mẫu cũ (che tên cũ Nguyễn Thị Thủy, che kết quả cũ...), sau đó nhúng font Unicode `Arial` và `Arial-Bold` (`templates/fonts/`) để vẽ đè thông tin bệnh nhân thực tế + kết quả xét nghiệm + kết luận + chữ ký bác sĩ.
  - Giữ nguyên con dấu đỏ và biểu đồ khuếch đại PCR từ file mẫu gốc.
  - Quá trình diễn ra trong **~60-100ms** và stream trực tiếp về trình duyệt.

---

## 4. BẢN ĐỒ CÁC MÀN HÌNH & COMPONENT CHÍNH

### Frontend (`bio-result-frontend`)
- **`app/page.tsx`**: Trang chính tích hợp Navigation giữa **Dashboard** (`activeCategory === 'dashboard'`) và **Bảng ca xét nghiệm**.
- **`components/layout/Header.tsx`**:
  - Menu thu/phóng sidebar.
  - **Chuông thông báo (Notification popup):** Hiển thị badge số lượng chưa đọc, popup nổi cuộn danh sách thông báo mới, nút *Đọc tất cả*, link *Xem phiếu ↗*.
  - **Quick User Switcher:** Bấm vào avatar để chuyển đổi nhanh giữa 5 tài khoản thử nghiệm quyền hạn.
  - Nút Đăng xuất Gentech.
- **`components/layout/Sidebar.tsx`**: Thanh danh mục 15 dịch vụ bên trái, chứa logo Gentech và thương hiệu GENTECH VIỆT NAM.
- **`components/dashboard/DashboardView.tsx`**:
  - Màn hình Báo cáo & Thống kê chuẩn GenHD.
  - 4 thẻ KPI: Tổng số phiếu (540), Nhập thông tin (25), Đang chạy KQ (35), Đã trả KQ (480).
  - 7 thẻ Gói dịch vụ: CELL, ThinPrep, HPV 40, HPV 20, HPV 23, Soi tươi, GPB (click chuyển tới dịch vụ đó).
  - Biểu đồ tròn SVG Donut (tỷ lệ phân bổ) & Biểu đồ cột SVG Bar chart (so sánh số lượng).
  - Khối thống kê tiến độ Bác sĩ (Biểu đồ nhóm Đang xử lý vs Đã hoàn tất + Bảng danh sách Bác sĩ kèm nút *Xem phiếu →*).
  - Chế độ Bác sĩ tự động hiển thị tiêu đề và banner lọc duy nhất ca của bác sĩ đó.
- **`components/cases/CaseTable.tsx`**: Bảng quản lý 9 cột đầy đủ, bộ lọc trạng thái, tìm kiếm từ khóa, khoảng ngày, menu thao tác (xem chi tiết, tải PDF, sửa phiếu, xóa phiếu có bảo vệ phân quyền Admin).
- **`app/results/[id]/page.tsx`**: Trang chi tiết ca bệnh chiếm toàn màn hình bên phải sidebar, gồm:
  - `PatientInfoCard.tsx`: Hành chính & Tiếp nhận mẫu.
  - `HpvResultCard.tsx`: Nhập 4 nhóm HPV, tải/xem biểu đồ PCR, kết luận, ký tên bác sĩ.
  - `ResultStickyBar.tsx`: Thanh điều hướng nổi dưới đáy (trạng thái phiếu, Xem PDF, Tải PDF).
  - `PdfPreviewSection.tsx`: Xem trực tiếp file PDF kết quả nhúng trên web.
- **`app/login/page.tsx`**: Trang đăng nhập mang nhận diện thương hiệu Gentech.

### Backend (`bio-result-backend`)
- **`src/cases/`**: Controller, Service, Schemas quản lý ca bệnh, thống kê (`GET /api/cases/stats`), xuất Excel (`GET /api/cases/stats/export-excel`).
- **`src/notifications/`**: Controller, Service, Schemas quản lý danh sách thông báo nổi (`GET /api/notifications`, `PUT /api/notifications`).
- **`src/users/`**: Quản lý người dùng và phân quyền.
- **`src/auth/`**: Đăng nhập và cấp JWT Token.

---

## 5. LỆNH VẬN HÀNH DỰ ÁN
```bash
# 1. Khởi động Backend (cổng 5002)
cd "d:\Tài liệu\HOCTAP\bio-result\bio-result-backend"
npm run start:dev

# 2. Khởi động Frontend (cổng 3000)
cd "d:\Tài liệu\HOCTAP\bio-result\bio-result-frontend"
npm run dev

# 3. Nạp lại dữ liệu mẫu (Seed 522 ca & các tài khoản bác sĩ)
cd "d:\Tài liệu\HOCTAP\bio-result\bio-result-backend"
npm run seed
```
