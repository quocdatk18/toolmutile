# 🔒 HƯỚNG DẪN OBFUSCATE CODE

## Mục đích
Obfuscate (mã hóa) code để bảo vệ logic kinh doanh khi bán tool cho khách hàng. Khách hàng không thể đọc hoặc sửa đổi code đã được obfuscate.

## Các file được bảo vệ
- `core/license-manager.js` - Hệ thống license (QUAN TRỌNG NHẤT)
- `core/api-key-manager.js` - Quản lý API keys
- `core/hidemium-api.js` - Tích hợp Hidemium API
- `core/profile-manager.js` - Quản lý profiles
- `core/sim-api-manager.js` - Quản lý SIM API
- `dashboard/server.js` - Server backend

## Cách sử dụng

### Option 1: Obfuscate chỉ License Manager (Nhanh)
```batch
OBFUSCATE_CODE.bat
```
- Chỉ mã hóa file license-manager.js
- Nhanh nhất, phù hợp khi chỉ cần bảo vệ license system

### Option 2: Obfuscate tất cả files (Khuyến nghị)
```batch
OBFUSCATE_ALL_CODE.bat
```
- Mã hóa tất cả các file quan trọng
- Bảo vệ toàn bộ logic kinh doanh
- Khuyến nghị cho production

### Option 3: Build package cho khách hàng (Tự động obfuscate)
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```
- Tự động obfuscate tất cả files
- Tạo package hoàn chỉnh cho khách hàng
- Tạo license key
- Xóa các file nhạy cảm

## Quy trình đầy đủ

### 1. Cài đặt dependencies (Lần đầu tiên)
```batch
npm install
```

### 2. Test code gốc
```batch
npm run dashboard
```
Đảm bảo mọi thứ hoạt động tốt trước khi obfuscate.

### 3. Obfuscate code
```batch
OBFUSCATE_ALL_CODE.bat
```

### 4. Kiểm tra files đã obfuscate
Các file `.obfuscated.js` sẽ được tạo ra:
- `core/license-manager.obfuscated.js`
- `core/api-key-manager.obfuscated.js`
- etc.

### 5. Build package cho khách hàng
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

Nhập thông tin:
- Tên khách hàng: `customer001`
- Loại license: `1-4` (Trial/Monthly/Quarterly/Lifetime)
- Bind machine: `y/n` (Có khóa với máy tính không)

### 6. Gửi cho khách hàng
Package sẽ được tạo trong folder:
```
customer-packages/customer001/
```

Nén folder này và gửi cho khách hàng.

## Lưu ý quan trọng

### ✅ Ưu điểm của Obfuscation
- Khách hàng không thể đọc code
- Không thể crack license system
- Không thể sửa đổi logic
- Bảo vệ secret key
- Bảo vệ API endpoints

### ⚠️ Lưu ý
- **LUÔN backup code gốc** - Script tự động backup vào folder `backups/`
- **Test sau khi obfuscate** - Đảm bảo code vẫn chạy đúng
- **Không commit obfuscated files** - Chỉ dùng cho customer packages
- **Lưu secret key** - Mỗi customer có secret key riêng

### 🔐 Bảo mật
- Mỗi customer package có secret key UNIQUE
- Secret key được thay thế tự động trong quá trình build
- License key được mã hóa với secret key
- Không thể dùng license key từ customer khác

## Cấu trúc Obfuscation

### Trước khi obfuscate:
```javascript
function validateLicense(licenseKey) {
    const SECRET_KEY = 'HIDEMIUM_TOOL_SECRET_2024';
    // ... readable code
}
```

### Sau khi obfuscate:
```javascript
var _0x4a2b=['dmFsaWRhdGVMaWNlbnNl','U0VDUkVUX0tFWQ=='];
(function(_0x3f4d2c,_0x4a2b1e){var _0x5c3a8f=function(_0x1d4e6b){...
```

## Troubleshooting

### Lỗi: "javascript-obfuscator not found"
```batch
npm install javascript-obfuscator
```

### Lỗi: "Obfuscation failed"
- Kiểm tra syntax errors trong code gốc
- Đảm bảo Node.js version >= 18.0.0
- Xem log chi tiết

### Code không chạy sau obfuscate
- Restore từ backup: `backups/`
- Kiểm tra lại code gốc
- Test từng file một

## Kiểm tra kết quả

### So sánh kích thước file:
```batch
dir core\license-manager.js
dir core\license-manager.obfuscated.js
```

File obfuscated thường lớn hơn 2-3 lần.

### Test obfuscated code:
1. Copy file obfuscated sang tên gốc (backup trước)
2. Chạy `npm run dashboard`
3. Test các chức năng
4. Nếu OK → Dùng cho customer

## Best Practices

### Khi phát triển:
- Làm việc với code gốc (không obfuscate)
- Commit code gốc lên Git
- Không commit obfuscated files

### Khi build cho khách hàng:
- Luôn dùng `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat`
- Lưu secret key của từng customer
- Test package trước khi gửi
- Gửi kèm README.txt

### Khi update tool:
- Update code gốc
- Test kỹ
- Build lại package mới
- Gửi update cho customer (nếu có license còn hạn)

## Tự động hóa

Bạn có thể tạo script tự động build cho nhiều customers:

```batch
@echo off
for %%c in (customer001 customer002 customer003) do (
    echo Building for %%c...
    REM Tự động build với parameters
)
```

## Support

Nếu gặp vấn đề:
1. Kiểm tra backup trong `backups/`
2. Xem docs trong `docs/`
3. Test với code gốc trước
4. Kiểm tra Node.js version

---

**Lưu ý cuối cùng:** Obfuscation không phải là mã hóa 100% an toàn, nhưng đủ để ngăn chặn 99% người dùng thông thường không thể đọc hoặc sửa code. Kết hợp với license system và secret key unique, tool của bạn sẽ được bảo vệ tốt.
