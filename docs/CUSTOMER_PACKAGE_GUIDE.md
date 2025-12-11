# 📦 Hướng Dẫn Tạo Package Cho Khách Hàng

## ⚠️ VẤN ĐỀ BẢO MẬT

Nếu gửi tool nguyên bản cho khách, họ có thể:
- ❌ Tự tạo license key bằng `generate-license.js`
- ❌ Đọc secret key trong `license-manager.js`
- ❌ Share tool cho người khác

## ✅ GIẢI PHÁP

### **Phương án 1: Xóa File Nhạy Cảm (Đơn giản)**

#### Bước 1: Chạy script tự động
```bash
CREATE_CUSTOMER_PACKAGE.bat
```

Script này sẽ:
- Copy toàn bộ tool vào folder `customer-package/`
- Xóa `tools/generate-license.js`
- Xóa folder `license-records/`
- Xóa file `.license` (nếu có)

#### Bước 2: Zip và gửi
```bash
# Zip folder customer-package
# Gửi file zip cho khách hàng
```

#### Bước 3: Tạo key riêng cho khách
```bash
node tools/generate-license.js --days 30 --username "customer_name"
```

Gửi key này cho khách qua email/telegram riêng.

---

### **Phương án 2: Thay Secret Key (Tốt hơn)**

Mỗi khách hàng có secret key riêng → Key của khách A không dùng được cho khách B.

#### Bước 1: Thay secret key
Mở `core/license-manager.js`, tìm dòng:
```javascript
this.secretKey = 'HIDEMIUM_TOOL_SECRET_2024';
```

Thay thành:
```javascript
this.secretKey = 'SECRET_CUSTOMER_001_XYZ123ABC';
```

**Lưu ý:** Mỗi khách hàng dùng secret khác nhau!

#### Bước 2: Tạo key với secret mới
```bash
node tools/generate-license.js --lifetime --username "customer001"
```

Key này chỉ hoạt động với secret `SECRET_CUSTOMER_001_XYZ123ABC`.

#### Bước 3: Xóa generate-license.js
```bash
del tools\generate-license.js
```

#### Bước 4: Zip và gửi
- Gửi tool (đã có secret riêng)
- Gửi key riêng

**Ưu điểm:**
- ✅ Mỗi khách có secret riêng
- ✅ Key của khách A không dùng được cho khách B
- ✅ Nếu khách crack được secret, chỉ ảnh hưởng 1 khách

---

### **Phương án 3: Obfuscate Code (Tốt nhất)**

Mã hóa code để khó đọc và crack.

#### Bước 1: Cài đặt obfuscator
```bash
npm install javascript-obfuscator
```

#### Bước 2: Obfuscate license-manager.js
```bash
node tools/obfuscate-license.js
```

File `core/license-manager.obfuscated.js` sẽ được tạo.

#### Bước 3: Thay thế file gốc
```bash
# Backup file gốc
copy core\license-manager.js core\license-manager.original.js

# Thay thế bằng obfuscated version
copy core\license-manager.obfuscated.js core\license-manager.js
```

#### Bước 4: Test
```bash
npm run dashboard
# Kiểm tra license vẫn hoạt động
```

#### Bước 5: Xóa file nhạy cảm và gửi
```bash
del tools\generate-license.js
del core\license-manager.original.js
del core\license-manager.obfuscated.js
```

**Ưu điểm:**
- ✅ Code rất khó đọc
- ✅ Secret key bị mã hóa
- ✅ Khó crack hơn nhiều

---

## 📋 CHECKLIST TRƯỚC KHI GỬI KHÁCH

- [ ] Đã xóa `tools/generate-license.js`
- [ ] Đã xóa folder `license-records/`
- [ ] Đã xóa file `.license` (nếu có)
- [ ] Đã thay secret key (nếu dùng phương án 2)
- [ ] Đã obfuscate code (nếu dùng phương án 3)
- [ ] Đã test tool vẫn chạy được
- [ ] Đã tạo key riêng cho khách
- [ ] Đã ghi chú thông tin khách trong file record

---

## 🎯 QUY TRÌNH BÁN TOOL

### 1. Khách hàng liên hệ
- Tư vấn gói license (trial, monthly, lifetime)
- Giải thích cách sử dụng

### 2. Tạo package riêng
```bash
# Thay secret key
# Sửa core/license-manager.js
this.secretKey = 'SECRET_CUSTOMER_ABC_' + Date.now();

# Tạo package
CREATE_CUSTOMER_PACKAGE.bat

# Zip
# Gửi cho khách
```

### 3. Tạo license key
```bash
node tools/generate-license.js --days 30 --username "customer_abc"
```

### 4. Gửi key riêng
- Gửi qua email/telegram
- Hướng dẫn activate

### 5. Hỗ trợ khách
- Hướng dẫn cài đặt
- Hướng dẫn activate license
- Hỗ trợ khi có vấn đề

---

## 🔐 BẢO MẬT NÂNG CAO

### Nếu muốn bảo mật tốt hơn nữa:

1. **Compile thành executable**
   - Dùng `pkg` để compile Node.js thành .exe
   - Khách không thấy source code

2. **Server-based license**
   - Key được check qua API server của bạn
   - Có thể thu hồi key bất cứ lúc nào
   - Track usage

3. **Hardware lock**
   - Bind key với CPU ID, motherboard serial
   - Không thể chạy trên máy khác

4. **Anti-debug**
   - Phát hiện debugger
   - Tự động thoát nếu bị debug

---

## ❓ FAQ

### Q: Khách có thể crack được không?
**A:** Có thể, nhưng rất khó nếu bạn:
- Obfuscate code
- Thay secret key mỗi khách
- Dùng server-based license

### Q: Nếu khách share tool cho người khác?
**A:** 
- Nếu dùng secret key riêng → Key không hoạt động
- Nếu dùng machine binding → Chỉ chạy trên 1 máy

### Q: Làm sao biết khách đang share?
**A:** Hiện tại không biết được. Cần nâng cấp lên server-based.

### Q: Có cách nào chống crack 100%?
**A:** Không có cách nào 100%. Nhưng có thể làm khó đến mức không đáng để crack.

---

## 📞 LƯU Ý

1. **Backup secret key cũ** trước khi thay
2. **Ghi chú secret key** của từng khách
3. **Test kỹ** trước khi gửi
4. **Hướng dẫn rõ ràng** cho khách
5. **Hỗ trợ nhiệt tình** để khách hài lòng

---

## 🎓 BEST PRACTICES

✅ **NÊN:**
- Thay secret key mỗi khách
- Obfuscate code trước khi gửi
- Xóa file generate-license.js
- Test kỹ trước khi gửi
- Backup mọi thứ

❌ **KHÔNG NÊN:**
- Gửi tool nguyên bản
- Dùng chung secret key cho nhiều khách
- Quên xóa file nhạy cảm
- Gửi key qua chat công khai
