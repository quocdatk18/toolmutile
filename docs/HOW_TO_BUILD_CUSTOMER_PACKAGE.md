# 📦 Hướng Dẫn Tạo Package Cho Khách Hàng

## 🎯 Có 2 Cách:

### **Cách 1: Package Thường (Nhanh)**
- Không obfuscate code
- Nhanh hơn
- Ít an toàn hơn

### **Cách 2: Package Obfuscated (Khuyến nghị)**
- Obfuscate code (mã hóa)
- Chậm hơn một chút
- An toàn hơn nhiều

---

## 🚀 CÁCH 1: Package Thường

### Bước 1: Chạy script
```bash
BUILD_CUSTOMER_PACKAGE.bat
```

### Bước 2: Nhập thông tin
```
Enter customer name: customer001
Select license type: 2 (Monthly)
Bind to machine? n
```

### Bước 3: Đợi hoàn thành
Script sẽ tự động:
- ✅ Tạo folder `customer-packages/customer001/`
- ✅ Copy toàn bộ tool
- ✅ Xóa file nhạy cảm
- ✅ Thay secret key riêng
- ✅ Tạo license key
- ✅ Tạo README.txt

### Bước 4: Zip và gửi
```bash
# Zip folder customer-packages/customer001/
# Gửi file ZIP cho khách
```

---

## 🔒 CÁCH 2: Package Obfuscated (Khuyến nghị)

### Bước 1: Cài đặt obfuscator (chỉ lần đầu)
```bash
npm install javascript-obfuscator
```

### Bước 2: Chạy script
```bash
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

### Bước 3: Nhập thông tin
```
Enter customer name: customer001
Select license type: 4 (Lifetime)
Bind to machine? y
```

### Bước 4: Đợi hoàn thành
Script sẽ tự động:
- ✅ Tạo folder `customer-packages/customer001/`
- ✅ Copy toàn bộ tool
- ✅ Thay secret key riêng
- ✅ **Obfuscate license-manager.js** 🔒
- ✅ Xóa file nhạy cảm
- ✅ Tạo license key
- ✅ Tạo README.txt

### Bước 5: Zip và gửi
```bash
# Zip folder customer-packages/customer001/
# Gửi file ZIP cho khách
```

---

## 📂 Cấu Trúc Package

Sau khi build, folder `customer-packages/customer001/` sẽ có:

```
customer-packages/customer001/
├── core/
│   ├── license-manager.js (đã obfuscate + secret key riêng)
│   ├── api-key-manager.js
│   └── ...
├── dashboard/
├── tools/
│   └── nohu-tool/
├── LICENSE_KEY.txt (⭐ Key cho khách)
├── README.txt (⭐ Hướng dẫn cho khách)
├── package.json
└── ...
```

**KHÔNG CÓ:**
- ❌ `tools/generate-license.js` (đã xóa)
- ❌ `tools/obfuscate-license.js` (đã xóa)
- ❌ `license-records/` (đã xóa)
- ❌ `.license` (đã xóa)
- ❌ `.git/` (đã xóa)

---

## 📋 File LICENSE_KEY.txt

File này chứa thông tin license cho khách:

```
License Key Record
==================
Generated: 09/12/2024, 10:30:00
Username: customer001
Type: LIFETIME
Machine Binding: YES
Machine ID: abc123def456...

License Key:
eyJ1c2VybmFtZSI6ImN1c3RvbWVyMDAxIiwibWFjaGluZUlkIjoiYWJjMTIzZGVmNDU2Li4uIiwiZXhwaXJ5IjotMSwiY3JlYXRlZCI6MTczMzc0MjYwMDAwMH0=.a1b2c3d4e5f6...
```

---

## 📝 File README.txt

Hướng dẫn cho khách hàng:

```
========================================
HIDEMIUM MULTI-TOOL
========================================

Customer: customer001

INSTALLATION:
  1. Install Node.js (if not installed)
  2. Run: npm install
  3. Run: npm run dashboard

ACTIVATION:
  1. Open dashboard
  2. Click "🔐 License" button
  3. Paste your license key
  4. Click "Activate License"

Your license key is in: LICENSE_KEY.txt

SUPPORT:
  Contact seller if you have any issues

========================================
```

---

## 🎯 Quy Trình Bán Tool

### 1. Khách hàng liên hệ
- Tư vấn gói license
- Thỏa thuận giá

### 2. Build package
```bash
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

### 3. Ghi chú thông tin
- Lưu secret key: `SECRET_customer001_12345_67890`
- Lưu thông tin khách trong `license-records/`

### 4. Zip và gửi
```bash
# Zip folder customer-packages/customer001/
# Gửi qua email/drive/wetransfer
```

### 5. Hướng dẫn khách
- Giải nén
- Cài đặt: `npm install`
- Chạy: `npm run dashboard`
- Activate license

### 6. Hỗ trợ
- Giải đáp thắc mắc
- Fix lỗi nếu có

---

## 🔐 Bảo Mật

### Secret Key Riêng
Mỗi khách có secret key khác nhau:
- Customer 001: `SECRET_customer001_12345_67890`
- Customer 002: `SECRET_customer002_23456_78901`
- Customer 003: `SECRET_customer003_34567_89012`

→ Key của khách A không dùng được cho khách B!

### Obfuscate Code
File `license-manager.js` sau khi obfuscate:
```javascript
// Trước
this.secretKey = 'SECRET_customer001_12345_67890';

// Sau (không đọc được)
var _0x4a2b=['U0VDUkVU','Y3VzdG9tZXIwMDE='];
(function(_0x123,_0x456){var _0x789=function(_0xabc){...
```

→ Khách không thể đọc được secret key!

---

## ❓ FAQ

### Q: Tool hiện tại có bị ảnh hưởng không?
**A:** KHÔNG! Script tạo package riêng trong folder `customer-packages/`, không động vào tool gốc.

### Q: Có thể tạo nhiều package cùng lúc?
**A:** Có! Mỗi khách có folder riêng:
- `customer-packages/customer001/`
- `customer-packages/customer002/`
- `customer-packages/customer003/`

### Q: Nếu khách mất key?
**A:** Xem lại file trong `license-records/license-customer001-...txt`

### Q: Nếu muốn gia hạn cho khách?
**A:** Tạo key mới với cùng username và secret key cũ.

### Q: Obfuscate có làm chậm tool không?
**A:** Không! Chỉ làm code khó đọc, không ảnh hưởng performance.

---

## 📊 Checklist

Trước khi gửi cho khách:

- [ ] Đã chạy script build
- [ ] Đã kiểm tra folder `customer-packages/customer_name/`
- [ ] Đã có file `LICENSE_KEY.txt`
- [ ] Đã có file `README.txt`
- [ ] Đã xóa file nhạy cảm (generate-license.js, v.v.)
- [ ] Đã obfuscate code (nếu dùng cách 2)
- [ ] Đã lưu secret key vào records
- [ ] Đã zip folder
- [ ] Đã test package (giải nén và chạy thử)

---

## 🎓 Tips

1. **Luôn dùng obfuscate** cho khách trả tiền
2. **Backup license-records/** thường xuyên
3. **Ghi chú rõ ràng** thông tin từng khách
4. **Test package** trước khi gửi
5. **Hỗ trợ nhiệt tình** để khách hài lòng

---

## 📞 Nếu Có Lỗi

### Lỗi: "javascript-obfuscator not found"
```bash
npm install javascript-obfuscator
```

### Lỗi: "Cannot find module"
```bash
# Trong folder package
npm install
```

### Lỗi: "License invalid"
- Kiểm tra secret key có đúng không
- Kiểm tra key có hết hạn không
- Kiểm tra machine binding (nếu có)

---

## ✅ Hoàn Tất!

Bây giờ bạn có thể:
- ✅ Tạo package cho khách tự động
- ✅ Mỗi khách có secret key riêng
- ✅ Code được obfuscate (bảo mật)
- ✅ Tool gốc không bị ảnh hưởng
- ✅ Sẵn sàng kinh doanh!

🎉 Chúc bạn bán tool thành công! 💰
