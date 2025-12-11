# 📅 Hướng Dẫn Tùy Chỉnh Thời Gian License

## ✨ Tính Năng Mới

Bây giờ bạn có thể **tùy chỉnh thời gian** cho license key theo:
- ⏱️ **Số phút** (để test khi key hết hạn)
- 📆 **Số ngày** (cho khách hàng thực tế)

Thay vì chỉ chọn các gói cố định!

---

## 🎯 Cách Sử Dụng

### 1️⃣ Khi Tạo Package Mới

1. Mở Admin Dashboard: `http://localhost:3000/admin.html`
2. Trong form "Tạo Package Mới"
3. Tại dropdown "Loại Bản Quyền", chọn:
   - **✏️ Tùy chỉnh số ngày...** (cho production)
   - **⏱️ Tùy chỉnh số phút (test)...** (để test expiry)
4. Một ô input mới sẽ xuất hiện
5. Nhập số phút/ngày bạn muốn
6. Click "Tạo Package"

**Ví dụ với NGÀY:**
- Nhập `15` → License 15 ngày
- Nhập `60` → License 60 ngày  
- Nhập `120` → License 120 ngày
- Nhập `500` → License 500 ngày

**Ví dụ với PHÚT (test):**
- Nhập `1` → License 1 phút (test nhanh)
- Nhập `5` → License 5 phút
- Nhập `10` → License 10 phút
- Nhập `30` → License 30 phút

---

### 2️⃣ Khi Tạo License Key Mới Cho Package Có Sẵn

1. Trong danh sách packages, click nút **🔑 Tạo Key Mới**
2. Modal sẽ hiện ra
3. Tại dropdown "Loại Bản Quyền", chọn:
   - **✏️ Tùy chỉnh số ngày...** (cho production)
   - **⏱️ Tùy chỉnh số phút (test)...** (để test expiry)
4. Một ô input mới sẽ xuất hiện
5. Nhập số phút/ngày bạn muốn
6. Click "Tạo Key"

---

## 📋 Các Gói Có Sẵn

Ngoài tùy chỉnh, bạn vẫn có thể chọn các gói có sẵn:

| Gói | Thời Gian | Mô Tả |
|-----|-----------|-------|
| 🧪 Test | 1 phút | Để test expiry nhanh |
| Trial | 7 ngày | Dùng thử |
| Monthly | 30 ngày | Gói tháng |
| Quarterly | 90 ngày | Gói quý |
| Half Year | 180 ngày | Gói nửa năm |
| Yearly | 365 ngày | Gói năm |
| Lifetime | Vĩnh viễn | Không giới hạn |

---

## ⚙️ Giới Hạn

### Theo Phút (Test):
- **Tối thiểu:** 1 phút
- **Tối đa:** 1440 phút (24 giờ)
- Chỉ nhập số nguyên dương
- ⚠️ **Chỉ dùng để test**, không dùng cho khách hàng thực

### Theo Ngày (Production):
- **Tối thiểu:** 1 ngày
- **Tối đa:** 3650 ngày (10 năm)
- Chỉ nhập số nguyên dương

---

## 💡 Lưu Ý

- Thời gian được tính từ lúc tạo license key
- License key sẽ hết hạn sau đúng số phút/ngày đã chọn
- Có thể tạo nhiều key với thời gian khác nhau cho cùng 1 package
- Thời gian tùy chỉnh sẽ được hiển thị trong LICENSE_KEY.txt
- **Phút chỉ dùng để test** - Để test xem tool xử lý license hết hạn như thế nào

---

## 🎉 Ví Dụ Thực Tế

### Test license hết hạn (1 phút):
1. Chọn "⏱️ Tùy chỉnh số phút (test)"
2. Nhập: `1`
3. Kết quả: License key hết hạn sau 1 phút
4. Dùng để test xem tool có hiển thị "License expired" đúng không

### Test license hết hạn (5 phút):
1. Chọn "⏱️ Tùy chỉnh số phút (test)"
2. Nhập: `5`
3. Kết quả: License key hết hạn sau 5 phút
4. Có thời gian để test các tính năng trước khi hết hạn

### Tạo license 45 ngày cho khách hàng VIP:
1. Chọn "✏️ Tùy chỉnh số ngày"
2. Nhập: `45`
3. Kết quả: License key có hiệu lực 45 ngày

### Tạo license 200 ngày cho khách hàng dài hạn:
1. Chọn "✏️ Tùy chỉnh số ngày"
2. Nhập: `200`
3. Kết quả: License key có hiệu lực 200 ngày

---

## 🔧 Technical Details

### Công thức tính thời gian:

**Theo Ngày:**
```javascript
expiry = now + (days * 24 * 60 * 60 * 1000)
```

**Theo Phút:**
```javascript
// Convert minutes to days first
days = minutes / 1440  // 1 day = 1440 minutes
expiry = now + (days * 24 * 60 * 60 * 1000)
```

Trong đó:
- `now` = thời điểm hiện tại (milliseconds)
- `days` = số ngày (hoặc phút đã convert sang ngày)
- Kết quả = timestamp hết hạn

**Ví dụ:**
- 1 phút = 1/1440 ngày = 0.000694 ngày
- 5 phút = 5/1440 ngày = 0.003472 ngày
- 60 phút = 60/1440 ngày = 0.041667 ngày (1 giờ)

---

## ✅ Hoàn Tất!

Giờ bạn có thể tạo license với thời gian linh hoạt theo nhu cầu khách hàng! 🎊
