# 🛡️ HƯỚNG DẪN CẤU TRÚC PHÂN QUYỀN VÀ BẢO MẬT HỆ THỐNG (RBAC & AUTH GUARDS)

Tài liệu này lưu trữ quy chuẩn phân quyền, mô hình bảo mật dữ liệu và hướng dẫn kỹ thuật để chỉnh sửa, mở rộng hoặc thêm vai trò (Role) mới trong tương lai.

---

## 1. 👥 CÁC VAI TRÒ (ROLES) TRONG HỆ THỐNG

Hệ thống phòng xét nghiệm được phân chia làm 3 vai trò chính dựa trên `UserRole`:

| Role ID | Tên vai trò | Phạm vi xem dữ liệu | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| `admin` | **Quản Trị Viên Phòng Lab** | **Tất cả các ca xét nghiệm** trên hệ thống | - Toàn quyền Tạo, Sửa, Xóa ca xét nghiệm.<br>- Duyệt trả kết quả (`da_tra_ket_qua`).<br>- Xem Báo cáo & Thống kê toàn phòng Lab (`/dashboard`).<br>- Xuất File Báo cáo Excel/CSV.<br>- Quản lý tài khoản & phân quyền. |
| `doctor` / `bacsy` | **Bác Sĩ Đọc Lam / Chẩn Đoán** | **Tất cả các ca xét nghiệm** hoặc theo phân công | - Xem danh sách & thông tin bệnh nhân.<br>- Nhập/Chỉnh sửa chỉ số sinh học (Bethesda, HPV, Soi tươi, GPB).<br>- Tải ảnh tế bào (`anhTeBao`), ảnh PCR (`anhHpv`).<br>- **Ký duyệt chữ ký điện tử** (Chuyển trạng thái phiếu, đóng dấu tên & ngày ký lên PDF). |
| `lab` | **Đơn Vị Gửi Mẫu / Phòng Khám Đối Tác** | **CHỈ XEM các ca thuộc `donVi` của tài khoản đó** | - Tự động phân vùng dữ liệu (**Data Isolation**).<br>- Xem trạng thái ca (Nhập thông tin ➔ Chạy kết quả ➔ Đã trả kết quả).<br>- Tải/In file PDF kết quả sau khi đã có chữ ký.<br>- ❌ **KHÔNG CÓ QUYỀN**: Sửa chỉ số y khoa, Ký duyệt kết quả, hoặc Xóa ca xét nghiệm. |

---

## 2. 🔐 BẢO MẬT & PHÂN VÙNG DỮ LIỆU TẠI BACKEND (NESTJS)

### 2.1 Các Guard Bảo mật
1. **`JwtAuthGuard`** (`src/auth/guards/jwt-auth.guard.ts`):
   - Đọc token từ HTTP Header `Authorization: Bearer <token>` hoặc URL Query `?token=...` (dùng cho link tải file PDF mở tab trực tiếp trên trình duyệt).
   - Xác thực chữ ký bí mật JWT (`JWT_SECRET`) và tự động giải mã thông tin tài khoản đính kèm vào `req.user`.
2. **`RolesGuard`** (`src/auth/guards/roles.guard.ts`):
   - Sử dụng Decorator `@Roles('admin', 'doctor')` để chặn truy cập ngay ở cấp Controller nếu tài khoản không đủ thẩm quyền.

### 2.2 Bảng Phân Quyền API Endpoint (`CasesController`)

| Endpoint | Method | Role được phép | Phân vùng & Xử lý bảo mật |
| :--- | :--- | :--- | :--- |
| `/api/cases` | `GET` | All | Nếu là `lab` ➔ Tự động ép lọc `donVi = req.user.donVi`. |
| `/api/cases/stats` | `GET` | `admin`, `doctor` (và `lab` xem số ca của mình) | Thống kê số lượng ca theo lọc Bác sĩ / Đơn vị gửi mẫu. |
| `/api/cases/stats/export-excel` | `GET` | `admin`, `doctor` | Xuất file CSV thống kê. |
| `/api/cases/:id` | `GET` | All | Nếu là `lab` ➔ Kiểm tra ca đó có đúng `donVi` của tài khoản không. Nếu không ➔ Trả về lỗi `403 Forbidden`. |
| `/api/cases/:id/export-pdf` | `GET` | All | Xuất file PDF động. Kiểm tra phân vùng dữ liệu với tài khoản `lab`. |
| `/api/cases` | `POST` | All | Tạo mới ca. Nếu `lab` tạo ➔ Tự động gán `donVi = req.user.donVi`. |
| `/api/cases/:id` | `PUT` | `admin`, `doctor` | Chỉnh sửa kết quả ca. Chặn `lab` (Lỗi `403 Forbidden`). |
| `/api/cases/:id/accept` | `POST` | `admin`, `doctor` | Tiếp nhận ca (chuyển sang `chay_ket_qua`). Chặn `lab`. |
| `/api/cases/:id/sign` | `PUT` | `admin`, `doctor` | Ký duyệt kết quả y khoa. Chặn `lab`. |
| `/api/cases/:id/release` | `PATCH` | `admin` | Phát hành kết quả (`da_tra_ket_qua`). Chặn `lab`. |
| `/api/cases/:id` | `DELETE` | `admin`, `doctor` | Xóa ca xét nghiệm. Chặn `lab`. |

---

## 3. 🛠️ HƯỚNG DẪN CHỈNH SỬA & MỞ RỘNG TRONG TƯƠNG LAI

### 3.1 Cách thêm một Role mới (Ví dụ: `technician` - Kỹ thuật viên Lab)
1. Mở file [user.schema.ts](file:///d:/Tài%20liệu/HOCTAP/bio-result/bio-result-backend/src/users/schemas/user.schema.ts):
   ```typescript
   export type UserRole = 'admin' | 'doctor' | 'bacsy' | 'lab' | 'technician';
   ```
2. Thêm giá trị enum vào Schema:
   ```typescript
   @Prop({ enum: ['admin', 'doctor', 'bacsy', 'lab', 'technician'] })
   role!: UserRole;
   ```
3. Cập nhật phân quyền trong [cases.controller.ts](file:///d:/Tài%20liệu/HOCTAP/bio-result/bio-result-backend/src/cases/cases.controller.ts) cho API bạn muốn cấp quyền:
   ```typescript
   @Roles('admin', 'technician')
   ```

### 3.2 Cách cấp/thay đổi Đơn vị gửi mẫu cho Tài khoản
Mỗi tài khoản `lab` gắn với một chuỗi `donVi` (Ví dụ: `"Phòng khám Sản Phụ Khoa Đức Kiên"`).
Để sửa đơn vị của tài khoản, sử dụng lệnh cập nhật trong Database MongoDB:
```javascript
db.users.updateOne(
  { username: "pk_duckien" },
  { $set: { donVi: "Phòng khám Sản Phụ Khoa Đức Kiên", role: "lab" } }
)
```

---

## 4. 🔑 CÁCH TỰ ĐỘNG GỬI JWT BEARER TOKEN TỪ FRONTEND

Mọi request từ Frontend khi sử dụng `fetch()` cần được đính kèm Header từ hàm `getAuthHeaders()` trong [lib/config.ts](file:///d:/Tài%20liệu/HOCTAP/bio-result/bio-result-frontend/lib/config.ts):

```typescript
import { getApiUrl, getAuthHeaders } from '@/lib/config';

// Ví dụ gửi request GET
const res = await fetch(getApiUrl(`/cases/${id}`), {
  headers: getAuthHeaders(),
});

// Ví dụ gửi link tải PDF mở tab mới
const token = localStorage.getItem('bio_token') || '';
window.open(getApiUrl(`/cases/${id}/export-pdf?token=${encodeURIComponent(token)}`), '_blank');
```

---

*Tài liệu được khởi tạo và cập nhật tự động vào ngày 24/09/2026.*
