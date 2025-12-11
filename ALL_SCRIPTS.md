# 📜 TẤT CẢ SCRIPTS CÓ SẴN

## 🚀 Scripts Chính (Dùng Thường Xuyên)

### 1. BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
**Mục đích:** Build package hoàn chỉnh cho khách hàng (TỰ ĐỘNG obfuscate)

**Cách dùng:**
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

**Làm gì:**
- ✅ Tự động obfuscate tất cả files quan trọng
- ✅ Tạo unique secret key cho customer
- ✅ Generate license key
- ✅ Xóa files nhạy cảm
- ✅ Tạo README cho customer
- ✅ Package sẵn sàng gửi

**Khi nào dùng:** Khi muốn tạo package cho khách hàng (KHUYẾN NGHỊ)

---

### 2. OBFUSCATE_ALL_CODE.bat
**Mục đích:** Obfuscate tất cả files quan trọng

**Cách dùng:**
```batch
OBFUSCATE_ALL_CODE.bat
```

**Làm gì:**
- ✅ Backup code gốc vào `backups/`
- ✅ Obfuscate tất cả files trong `core/` và `dashboard/server.js`
- ✅ Tạo files `.obfuscated.js`

**Khi nào dùng:** Khi muốn obfuscate code trước, test riêng

---

### 3. OBFUSCATE_CODE.bat
**Mục đích:** Obfuscate chỉ license-manager.js (nhanh)

**Cách dùng:**
```batch
OBFUSCATE_CODE.bat
```

**Làm gì:**
- ✅ Backup license-manager.js
- ✅ Obfuscate chỉ file license-manager.js
- ✅ Tạo file `.obfuscated.js`

**Khi nào dùng:** Khi chỉ cần bảo vệ license system (nhanh nhất)

---

### 4. TEST_OBFUSCATED.bat
**Mục đích:** Test code đã obfuscate

**Cách dùng:**
```batch
TEST_OBFUSCATED.bat
```

**Làm gì:**
- ✅ Backup code hiện tại
- ✅ Replace với obfuscated versions
- ✅ Start server để test
- ✅ Restore code gốc sau khi test

**Khi nào dùng:** Sau khi obfuscate, muốn test xem code có chạy không

---

## 📦 Scripts Build Package

### 5. BUILD_CUSTOMER_PACKAGE.bat
**Mục đích:** Build package KHÔNG obfuscate (dev only)

**Cách dùng:**
```batch
BUILD_CUSTOMER_PACKAGE.bat
```

**Làm gì:**
- Copy tất cả files
- Generate license key
- Xóa files nhạy cảm
- KHÔNG obfuscate code

**Khi nào dùng:** Chỉ dùng cho testing, KHÔNG dùng cho khách hàng thật

---

### 6. CREATE_CUSTOMER_PACKAGE.bat
**Mục đích:** Script cũ (deprecated)

**Khi nào dùng:** Không nên dùng, dùng `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat` thay thế

---

### 7. CREATE_DISTRIBUTION.bat
**Mục đích:** Tạo distribution package

**Cách dùng:**
```batch
CREATE_DISTRIBUTION.bat
```

**Khi nào dùng:** Khi muốn tạo distribution cho nhiều customers

---

## 🛠️ Scripts Development

### 8. START_DASHBOARD.bat
**Mục đích:** Start dashboard server

**Cách dùng:**
```batch
START_DASHBOARD.bat
```
hoặc
```batch
npm run dashboard
```

**Làm gì:**
- Start Express server
- Mở dashboard trên http://localhost:3000

**Khi nào dùng:** Development, testing

---

### 9. INSTALL.bat
**Mục đích:** Cài đặt dependencies

**Cách dùng:**
```batch
INSTALL.bat
```
hoặc
```batch
npm install
```

**Khi nào dùng:** Lần đầu setup project hoặc sau khi update dependencies

---

## 🔧 Scripts Tools (Node.js)

### 10. tools/generate-license.js
**Mục đích:** Generate license key

**Cách dùng:**
```batch
# Trial 7 days
node tools/generate-license.js --days 7 --username customer001

# Monthly
node tools/generate-license.js --days 30 --username customer001

# Lifetime
node tools/generate-license.js --lifetime --username customer001

# With machine binding
node tools/generate-license.js --days 30 --bind --username customer001
```

**Khi nào dùng:** Khi cần generate license key riêng

---

### 11. tools/activate-license.js
**Mục đích:** Activate license (testing)

**Cách dùng:**
```batch
node tools/activate-license.js
```

**Khi nào dùng:** Test license activation

---

### 12. tools/obfuscate-license.js
**Mục đích:** Obfuscate chỉ license-manager.js

**Cách dùng:**
```batch
node tools/obfuscate-license.js
```

**Khi nào dùng:** Được gọi tự động bởi `OBFUSCATE_CODE.bat`

---

### 13. tools/obfuscate-all.js
**Mục đích:** Obfuscate tất cả files quan trọng

**Cách dùng:**
```batch
node tools/obfuscate-all.js
```

**Khi nào dùng:** Được gọi tự động bởi `OBFUSCATE_ALL_CODE.bat`

---

## 📊 So Sánh Scripts

| Script | Obfuscate | Build Package | Generate License | Dùng cho Customer |
|--------|-----------|---------------|------------------|-------------------|
| BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat | ✅ | ✅ | ✅ | ✅ KHUYẾN NGHỊ |
| BUILD_CUSTOMER_PACKAGE.bat | ❌ | ✅ | ✅ | ❌ Dev only |
| OBFUSCATE_ALL_CODE.bat | ✅ | ❌ | ❌ | ⚠️ Cần build sau |
| OBFUSCATE_CODE.bat | ✅ (1 file) | ❌ | ❌ | ⚠️ Cần build sau |
| TEST_OBFUSCATED.bat | ❌ | ❌ | ❌ | ❌ Testing only |

---

## 🎯 Workflow Khuyến Nghị

### Workflow 1: Build Package Nhanh (KHUYẾN NGHỊ)
```batch
1. npm install
2. BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
3. Gửi package cho customer
```

### Workflow 2: Test Trước Khi Build
```batch
1. npm install
2. OBFUSCATE_ALL_CODE.bat
3. TEST_OBFUSCATED.bat
4. BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
5. Gửi package cho customer
```

### Workflow 3: Development
```batch
1. npm install
2. START_DASHBOARD.bat (hoặc npm run dashboard)
3. Develop & test
4. Khi xong → Workflow 1 hoặc 2
```

---

## 🔍 Chi Tiết Từng Script

### BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```
Input:
  - Customer name
  - License type (1-4)
  - Machine binding (y/n)

Output:
  - customer-packages/[customer-name]/
  - LICENSE_KEY.txt
  - README.txt
  - Obfuscated code
  - Unique secret key

Thời gian: ~30-60 giây
```

### OBFUSCATE_ALL_CODE.bat
```
Input: Không

Output:
  - core/*.obfuscated.js
  - dashboard/server.obfuscated.js
  - backups/ folder

Thời gian: ~10-20 giây
```

### TEST_OBFUSCATED.bat
```
Input: Không

Output:
  - Start server với obfuscated code
  - Test manual
  - Auto restore sau khi stop

Thời gian: Tùy thời gian test
```

---

## ⚠️ Lưu Ý Quan Trọng

### ✅ LUÔN DÙNG:
- `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat` - Cho customers thật
- `TEST_OBFUSCATED.bat` - Test trước khi gửi
- `START_DASHBOARD.bat` - Development

### ❌ KHÔNG DÙNG:
- `BUILD_CUSTOMER_PACKAGE.bat` - Cho customers (không bảo vệ code)
- `CREATE_CUSTOMER_PACKAGE.bat` - Deprecated

### ⚠️ CẨN THẬN:
- Luôn backup trước khi obfuscate (tự động)
- Test package trước khi gửi
- Lưu secret key sau khi build

---

## 🆘 Troubleshooting

### Script không chạy:
```batch
# Check Node.js
node --version

# Reinstall dependencies
npm install

# Check javascript-obfuscator
npm list javascript-obfuscator
```

### Obfuscation fails:
```batch
npm install javascript-obfuscator
```

### Package không chạy:
- Test với `TEST_OBFUSCATED.bat` trước
- Check console errors
- Restore từ backups/

---

## 📚 Tài Liệu Liên Quan

- [README.md](README.md) - Overview
- [QUICK_START_OBFUSCATE.md](QUICK_START_OBFUSCATE.md) - Quick start
- [docs/HUONG_DAN_OBFUSCATE.md](docs/HUONG_DAN_OBFUSCATE.md) - Chi tiết
- [CHECKLIST_TRUOC_KHI_BAN.md](CHECKLIST_TRUOC_KHI_BAN.md) - Checklist

---

**Tóm lại: Dùng `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat` là đủ! 🎉**
