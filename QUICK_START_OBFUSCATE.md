# 🚀 QUICK START - Obfuscate & Build Customer Package

## Bước 1: Cài đặt (Chỉ lần đầu)
```batch
npm install
```

## Bước 2: Build Package cho Khách hàng
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

Nhập thông tin khi được hỏi:
- **Customer name**: `customer001` (hoặc tên khách hàng)
- **License type**: 
  - `1` = Trial 7 ngày
  - `2` = Monthly (30 ngày)
  - `3` = Quarterly (90 ngày)
  - `4` = Lifetime (vĩnh viễn)
- **Bind to machine**: 
  - `y` = Khóa với máy tính (khuyến nghị)
  - `n` = Không khóa

## Bước 3: Gửi cho Khách hàng

Package được tạo tại:
```
customer-packages/customer001/
```

**Nén folder này và gửi cho khách hàng.**

## Bước 4: Hướng dẫn Khách hàng

Khách hàng làm theo file `README.txt` trong package:
1. Giải nén package
2. Chạy: `npm install`
3. Chạy: `npm run dashboard`
4. Mở dashboard và activate license (dùng key trong `LICENSE_KEY.txt`)

---

## 🔒 Code đã được bảo vệ

✅ Tất cả code quan trọng đã được obfuscate  
✅ License system không thể đọc được  
✅ Secret key unique cho mỗi customer  
✅ Không thể crack hoặc sửa đổi  

---

## 📚 Các Scripts Khác

### Chỉ obfuscate (không build package)
```batch
OBFUSCATE_ALL_CODE.bat
```

### Test obfuscated code
```batch
TEST_OBFUSCATED.bat
```

### Build package không obfuscate (dev only)
```batch
BUILD_CUSTOMER_PACKAGE.bat
```

---

## ⚠️ Lưu ý

- **Lưu secret key** được hiển thị sau khi build
- **Backup code gốc** (tự động backup vào `backups/`)
- **Test package** trước khi gửi khách hàng
- **Không commit** obfuscated files lên Git

---

## 🆘 Troubleshooting

### Lỗi: "javascript-obfuscator not found"
```batch
npm install javascript-obfuscator
```

### Lỗi: "Cannot find module"
```batch
npm install
```

### Code không chạy sau obfuscate
- Restore từ `backups/` folder
- Chạy lại từ đầu

---

## 📖 Đọc thêm

- [Hướng dẫn chi tiết](docs/HUONG_DAN_OBFUSCATE.md)
- [Customer Package Guide](docs/CUSTOMER_PACKAGE_GUIDE.md)
- [License System](docs/LICENSE_SYSTEM.md)
