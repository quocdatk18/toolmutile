# 🧪 Test Custom Time Feature

## Quick Test Guide

### Test 1: Tạo License 1 Phút (Test Expiry)

1. Mở: `http://localhost:3000/admin.html`
2. Form "Tạo Package Mới":
   - Tên: `test_1minute`
   - Loại: Chọn **⏱️ Tùy chỉnh số phút (test)...**
   - Nhập: `1`
   - Machine Binding: ✅
3. Click "Tạo Package"
4. Kích hoạt license trong dashboard
5. Đợi 1 phút
6. Refresh trang → Sẽ thấy "License expired"

---

### Test 2: Tạo License 5 Phút

1. Chọn **⏱️ Tùy chỉnh số phút (test)...**
2. Nhập: `5`
3. Có 5 phút để test các tính năng

---

### Test 3: Tạo License 45 Ngày (Custom Days)

1. Chọn **✏️ Tùy chỉnh số ngày...**
2. Nhập: `45`
3. License có hiệu lực 45 ngày

---

### Test 4: Tạo Key Mới Với Thời Gian Khác

1. Click **🔑 Tạo Key Mới** trên package có sẵn
2. Chọn **⏱️ Tùy chỉnh số phút (test)...**
3. Nhập: `2`
4. Tạo key mới có hiệu lực 2 phút

---

## Expected Results

### LICENSE_KEY.txt sẽ hiển thị:

**Với 1 phút:**
```
Type: 1 minutes
```

**Với 5 phút:**
```
Type: 5 minutes
```

**Với 45 ngày:**
```
Type: 45 days
```

---

## Validation Tests

### ✅ Should Pass:
- Nhập 1 phút → OK
- Nhập 1440 phút (24h) → OK
- Nhập 1 ngày → OK
- Nhập 3650 ngày → OK

### ❌ Should Fail:
- Nhập 0 phút → Error
- Nhập 1441 phút → Error (max 1440)
- Nhập 0 ngày → Error
- Nhập 3651 ngày → Error (max 3650)
- Nhập số âm → Error
- Không nhập gì → Error

---

## 🎯 Use Cases

### Development/Testing:
- 1 phút: Test expiry nhanh
- 5 phút: Test features trước khi hết hạn
- 10 phút: Demo cho khách hàng

### Production:
- 15 ngày: Trial ngắn
- 45 ngày: Gói custom cho VIP
- 100 ngày: Gói đặc biệt
- 500 ngày: Khách hàng dài hạn

---

## 📝 Notes

- Thời gian bắt đầu từ lúc tạo key
- Có thể tạo nhiều key với thời gian khác nhau
- Phút chỉ dùng để test, không dùng cho khách hàng thực
- Backend tự động convert phút sang days (minutes/1440)
