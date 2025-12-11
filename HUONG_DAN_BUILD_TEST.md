# 🔧 HƯỚNG DẪN BUILD TEST PACKAGE

## ⚠️ Vấn Đề

Package test hiện tại chưa đầy đủ files (chỉ có LICENSE_KEY.txt và README.txt).

## ✅ Giải Pháp

Build lại package bằng script chính:

### Bước 1: Xóa package cũ (optional)
```batch
rmdir /s /q customer-packages\test_customer
```

### Bước 2: Chạy script build
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

### Bước 3: Nhập thông tin khi được hỏi

**1. Customer name:**
```
test_customer
```
(Gõ và Enter)

**2. License type:**
```
1
```
(Chọn 1 = Trial 7 days, rồi Enter)

**3. Machine binding:**
```
y
```
(Gõ y và Enter)

### Bước 4: Đợi build hoàn tất

Script sẽ:
- Obfuscate 6 files (~20 giây)
- Generate license key
- Create package
- Show secret key

### Bước 5: Lưu secret key

Khi build xong, sẽ hiển thị secret key như:
```
🔐 Secret key: SECRET_test_customer_XXXXX_XXXXX
```

**LƯU KEY NÀY!**

### Bước 6: Test package

```batch
TEST_NGAY.bat
```

---

## 🎯 Tóm Tắt Nhanh

```batch
# 1. Build package
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat

# Nhập:
# - test_customer
# - 1
# - y

# 2. Lưu secret key

# 3. Test
TEST_NGAY.bat
```

---

## 💡 Lưu Ý

- Package cũ sẽ bị ghi đè
- Secret key mới sẽ được tạo
- License key mới sẽ được tạo
- Mất khoảng 1-2 phút để build

---

**Bắt đầu ngay:**
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```
