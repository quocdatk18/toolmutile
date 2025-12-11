# 🧪 TEST MANUAL - BƯỚC ĐƠN GIẢN

## Vấn Đề Hiện Tại
- Packages cũ có vấn đề secret key mismatch
- Cần build package mới ĐÚNG

## ✅ Giải Pháp: Chạy Manual

### Bước 1: Mở Command Prompt (CMD)
1. Nhấn `Windows + R`
2. Gõ: `cmd`
3. Enter

### Bước 2: Vào Folder Project
```batch
cd C:\Users\DDC\Desktop\hidemium-multi-tool
```

### Bước 3: Xóa Packages Cũ (nếu có)
```batch
rmdir /s /q customer-packages
```

### Bước 4: Build Package Test Mới
```batch
node build-test-final.js
```

Script sẽ:
- Tạo package: `customer-packages/test_final/`
- Generate secret key
- Generate license key với secret key ĐÚNG
- License key sẽ HOẠT ĐỘNG!

### Bước 5: Test Package
```batch
cd customer-packages\test_final
npm install
npm run dashboard
```

Hoặc chạy file:
```batch
START.bat
```

### Bước 6: Activate License
1. Mở browser: http://localhost:3000
2. Click "License" button
3. Copy license key từ `LICENSE_KEY.txt`
4. Paste và click "Activate"

**License sẽ hoạt động vì secret key đã KHỚP!** ✅

---

## 🎯 Tóm Tắt Nhanh

```batch
# Trong CMD:
cd C:\Users\DDC\Desktop\hidemium-multi-tool
rmdir /s /q customer-packages
node build-test-final.js
cd customer-packages\test_final
START.bat
```

Sau đó activate license trong dashboard!

---

## 📝 Files Đã Tạo

1. **build-test-final.js** - Script build đúng (fix secret key issue)
2. **RUN_BUILD_TEST_FINAL.bat** - Batch file để chạy
3. **TEST_MANUAL_STEPS.md** - File này

---

**Chạy trong CMD để test! 🚀**
