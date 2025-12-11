# 🖼️ Setup Test Screenshots

## 🎯 Mục Đích
Tạo cấu trúc thư mục test để xem kết quả ngay mà không cần chạy automation.

---

## 🚀 Cách 1: Tạo Cấu Trúc Test Mới

### Windows:
```bash
# Double-click file:
CREATE_TEST_STRUCTURE.bat
```

### Mac/Linux:
```bash
node create-test-structure.js
```

### Kết Quả:
```
screenshots/
  ├── dat11111/
  │   ├── 2025-01-10T10-30-45/
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   │   ├── tt88.png
  │   ├── 2025-01-10T14-20-30/
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   │   ├── tt88.png
  │   │   ├── mm99.png
  │   ├── 2025-01-11T09-15-20/
  │   │   ├── go99.png
  │   │   ├── nohu.png
  ├── test123/
  │   ├── 2025-01-10T11-45-00/
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   │   ├── tt88.png
  │   │   ├── mm99.png
  │   │   ├── 789p.png
  ├── vip999/
  │   ├── 2025-01-09T16-30-15/
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   ├── 2025-01-10T08-00-00/
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   │   ├── tt88.png
```

**Tổng cộng**:
- 3 users
- 6 sessions
- 23 screenshots

---

## 🔄 Cách 2: Migrate Cấu Trúc Cũ

Nếu bạn đã có screenshots với cấu trúc cũ:

### Windows:
```bash
# Double-click file:
MIGRATE_SCREENSHOTS.bat
```

### Mac/Linux:
```bash
node migrate-to-session-structure.js
```

### Trước Migration:
```
screenshots/
  ├── dat11111/
  │   ├── go99-2025-01-10T10-30-45-123Z.png
  │   ├── nohu-2025-01-10T10-30-50-456Z.png
  │   ├── go99-2025-01-10T14-20-30-789Z.png
```

### Sau Migration:
```
screenshots/
  ├── dat11111/
  │   ├── 2025-01-10T10-30-45/
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   ├── 2025-01-10T14-20-30/
  │   │   ├── go99.png
```

---

## 👀 Xem Kết Quả

### 1. Start Dashboard:
```bash
npm run dashboard
```

### 2. Mở Browser:
```
http://localhost:3000
```

### 3. Vào NOHU Tool:
- Click tab "NOHU Auto Tool"
- Scroll xuống phần "Kết Quả Automation"

### 4. Xem Bảng Kết Quả:
```
| ☑ | Profile | Tài Khoản | Số Trang | Số Lần Check | Trạng Thái | Kết Quả | Thời Gian |
|---|---------|-----------|----------|--------------|------------|---------|-----------|
| ☑ | Profile | dat11111  | 3 trang  | 1 lần        | ✅ 3       | 📷      | 10:30:45  |
| ☑ | Profile | dat11111  | 4 trang  | 1 lần        | ✅ 4       | 📷      | 14:20:30  |
| ☑ | Profile | dat11111  | 2 trang  | 1 lần        | ✅ 2       | 📷      | 09:15:20  |
| ☑ | Profile | test123   | 5 trang  | 1 lần        | ✅ 5       | 📷      | 11:45:00  |
| ☑ | Profile | vip999    | 2 trang  | 1 lần        | ✅ 2       | 📷      | 16:30:15  |
| ☑ | Profile | vip999    | 3 trang  | 1 lần        | ✅ 3       | 📷      | 08:00:00  |
```

### 5. Click Icon 📷:
- Xem tất cả screenshots của session đó
- Modal hiển thị grid ảnh

---

## 🧪 Test Các Tính Năng

### Test 1: Xem Screenshots
```
1. Click icon 📷 ở dòng "dat11111 - 10:30:45"
2. Modal mở ra hiển thị 3 ảnh: go99, nohu, tt88
3. Click ảnh để xem full size
```

### Test 2: Xóa Session
```
1. Chọn checkbox của session "dat11111 - 10:30:45"
2. Click "Xóa Đã Chọn"
3. Confirm
4. Session đó biến mất, các session khác giữ nguyên
```

### Test 3: Xóa Nhiều Sessions
```
1. Chọn checkbox của 2-3 sessions
2. Click "Xóa Đã Chọn"
3. Confirm
4. Tất cả sessions đã chọn bị xóa
```

### Test 4: Select All
```
1. Click checkbox ở header (Select All)
2. Tất cả checkboxes được chọn
3. Click "Xóa Đã Chọn"
4. Confirm
5. Tất cả kết quả bị xóa
```

### Test 5: Tải Lại
```
1. Click "Tải Lại"
2. Bảng refresh, load lại từ server
3. Kết quả cập nhật (nếu có thay đổi)
```

---

## 🗑️ Xóa Test Data

Nếu muốn xóa tất cả test data:

### Windows:
```bash
rmdir /s /q screenshots
```

### Mac/Linux:
```bash
rm -rf screenshots
```

Hoặc dùng nút "Xóa Tất Cả" trong dashboard.

---

## 📝 Lưu Ý

### Dummy PNG Files:
- Script tạo file PNG 1x1 pixel (transparent)
- Chỉ để test cấu trúc, không phải ảnh thật
- Kích thước: ~67 bytes mỗi file

### Session ID Format:
- Format: `YYYY-MM-DDTHH-MM-SS`
- Ví dụ: `2025-01-10T10-30-45`
- Dùng để sort theo thời gian

### Backward Compatibility:
- Code vẫn hỗ trợ cấu trúc cũ
- Có thể mix cả 2 cấu trúc
- Migration script không xóa file gốc (chỉ move)

---

## ✅ Checklist

- [ ] Chạy `CREATE_TEST_STRUCTURE.bat` hoặc `node create-test-structure.js`
- [ ] Start dashboard: `npm run dashboard`
- [ ] Mở browser: `http://localhost:3000`
- [ ] Vào NOHU Tool
- [ ] Xem bảng kết quả (6 dòng)
- [ ] Click icon 📷 để xem ảnh
- [ ] Test xóa session
- [ ] Test select all
- [ ] Test tải lại

---

## 🎉 Kết Luận

Bây giờ bạn có thể:
- ✅ Xem kết quả ngay mà không cần chạy automation
- ✅ Test tất cả tính năng UI
- ✅ Verify cấu trúc thư mục mới hoạt động đúng
- ✅ Demo cho khách hàng

Enjoy! 🚀
