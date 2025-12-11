# ✅ CHECKLIST TRƯỚC KHI BÁN TOOL

## 📋 Chuẩn bị ban đầu

### 1. Cài đặt Dependencies
- [ ] Đã chạy `npm install`
- [ ] Đã cài `javascript-obfuscator`
- [ ] Node.js version >= 18.0.0
- [ ] Tất cả dependencies không có lỗi

### 2. Test Code Gốc
- [ ] Dashboard chạy được (`npm run dashboard`)
- [ ] License system hoạt động
- [ ] Hidemium API kết nối được
- [ ] Profile management hoạt động
- [ ] Tất cả tools chạy được
- [ ] Không có lỗi console

---

## 🔒 Obfuscation & Build

### 3. Obfuscate Code
- [ ] Đã chạy `OBFUSCATE_ALL_CODE.bat`
- [ ] Tất cả files `.obfuscated.js` được tạo
- [ ] Backup tự động trong folder `backups/`
- [ ] Không có lỗi obfuscation

### 4. Test Obfuscated Code
- [ ] Đã chạy `TEST_OBFUSCATED.bat`
- [ ] Dashboard vẫn chạy được với code obfuscated
- [ ] License system vẫn hoạt động
- [ ] Không có lỗi runtime
- [ ] Tất cả chức năng vẫn OK

### 5. Build Customer Package
- [ ] Đã chạy `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat`
- [ ] Nhập đúng tên customer
- [ ] Chọn đúng loại license
- [ ] Chọn machine binding (khuyến nghị: Yes)
- [ ] Package được tạo thành công
- [ ] **ĐÃ LƯU SECRET KEY** (quan trọng!)

---

## 📦 Kiểm tra Package

### 6. Cấu trúc Package
Kiểm tra folder `customer-packages/[customer-name]/`:

- [ ] Có file `README.txt`
- [ ] Có file `LICENSE_KEY.txt`
- [ ] Có file `package.json`
- [ ] Có folder `core/` với files đã obfuscate
- [ ] Có folder `dashboard/`
- [ ] Có folder `config/`
- [ ] Có folder `tools/` (chỉ tools cần thiết)

### 7. Files Nhạy Cảm Đã Xóa
Đảm bảo KHÔNG có các files sau trong package:

- [ ] ❌ `tools/generate-license.js`
- [ ] ❌ `tools/obfuscate-license.js`
- [ ] ❌ `tools/activate-license.js`
- [ ] ❌ `license-records/`
- [ ] ❌ `customer-packages/`
- [ ] ❌ `.license`
- [ ] ❌ `BUILD_*.bat`
- [ ] ❌ `CREATE_*.bat`
- [ ] ❌ `.git/`
- [ ] ❌ `.gitignore`
- [ ] ❌ `backups/`

### 8. Code Đã Obfuscate
Mở các files trong package và kiểm tra:

- [ ] `core/license-manager.js` - Không thể đọc được
- [ ] `core/api-key-manager.js` - Không thể đọc được
- [ ] `core/hidemium-api.js` - Không thể đọc được
- [ ] Secret key đã được thay thế (unique cho customer)
- [ ] Không có comment hoặc code dễ đọc

---

## 🧪 Test Package Khách Hàng

### 9. Test như Khách Hàng
Copy package ra folder khác và test:

- [ ] Giải nén package
- [ ] Chạy `npm install` (không lỗi)
- [ ] Chạy `npm run dashboard`
- [ ] Dashboard mở được
- [ ] Activate license với key trong `LICENSE_KEY.txt`
- [ ] License được activate thành công
- [ ] Tất cả chức năng hoạt động
- [ ] Không có lỗi console

### 10. Test License System
- [ ] License key hợp lệ
- [ ] Expiration date đúng
- [ ] Machine binding hoạt động (nếu có)
- [ ] Không thể dùng license key từ customer khác
- [ ] License info hiển thị đúng trong dashboard

---

## 📝 Documentation

### 11. Tài Liệu cho Khách Hàng
- [ ] `README.txt` trong package rõ ràng
- [ ] `LICENSE_KEY.txt` có license key
- [ ] Hướng dẫn cài đặt đầy đủ
- [ ] Hướng dẫn activate license
- [ ] Thông tin support (nếu có)

### 12. Lưu Trữ Thông Tin
Lưu vào file riêng hoặc database:

- [ ] Customer name
- [ ] License type & expiration
- [ ] Secret key (QUAN TRỌNG!)
- [ ] Machine ID (nếu có binding)
- [ ] Ngày tạo package
- [ ] License key đã gửi

---

## 📤 Giao Hàng

### 13. Chuẩn Bị Gửi
- [ ] Nén folder package thành ZIP
- [ ] Tên file ZIP rõ ràng (vd: `hidemium-tool-customer001.zip`)
- [ ] Kiểm tra kích thước file hợp lý
- [ ] Test giải nén ZIP không lỗi

### 14. Gửi cho Khách Hàng
- [ ] Gửi file ZIP
- [ ] Gửi kèm hướng dẫn (nếu cần)
- [ ] Thông báo license expiration date
- [ ] Cung cấp thông tin support
- [ ] Xác nhận khách hàng nhận được

---

## 🔐 Bảo Mật

### 15. Bảo Vệ Thông Tin
- [ ] Secret key được lưu an toàn
- [ ] Không share secret key
- [ ] License records được backup
- [ ] Code gốc được bảo vệ (không gửi cho customer)
- [ ] Git repository private (nếu dùng Git)

---

## 📊 Sau Khi Bán

### 16. Follow Up
- [ ] Khách hàng activate thành công
- [ ] Không có vấn đề kỹ thuật
- [ ] Khách hàng hài lòng
- [ ] Lưu feedback (nếu có)

### 17. Support
- [ ] Sẵn sàng support nếu có vấn đề
- [ ] Có thể generate license mới nếu cần
- [ ] Có thể extend license nếu khách hàng gia hạn

---

## ⚠️ LƯU Ý QUAN TRỌNG

### ❌ KHÔNG BAO GIỜ:
- Gửi code gốc (không obfuscate) cho khách hàng
- Share secret key giữa các customers
- Commit obfuscated files lên Git
- Quên lưu secret key
- Gửi package chưa test

### ✅ LUÔN LUÔN:
- Test package trước khi gửi
- Lưu secret key an toàn
- Backup license records
- Test như khách hàng
- Obfuscate code trước khi build

---

## 🎯 Checklist Nhanh (TL;DR)

```
1. ✅ npm install
2. ✅ Test code gốc
3. ✅ OBFUSCATE_ALL_CODE.bat
4. ✅ TEST_OBFUSCATED.bat
5. ✅ BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
6. ✅ LƯU SECRET KEY
7. ✅ Test package như khách hàng
8. ✅ Nén thành ZIP
9. ✅ Gửi cho khách hàng
10. ✅ Follow up
```

---

## 📞 Nếu Có Vấn Đề

### Obfuscation fails:
```batch
npm install javascript-obfuscator
OBFUSCATE_ALL_CODE.bat
```

### Package không chạy:
- Restore từ backups/
- Build lại từ đầu
- Check Node.js version

### License không hoạt động:
- Kiểm tra secret key
- Kiểm tra expiration date
- Generate license mới

---

**Hoàn thành tất cả checklist = Sẵn sàng bán tool! 🎉**
