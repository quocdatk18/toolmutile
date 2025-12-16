# Hướng Dẫn Nâng Cấp Package Giữ Lại MachineID

## Vấn Đề
Khi nâng cấp package cho khách hàng, MachineID cũ không được giữ lại, dẫn đến:
- License cũ không còn hoạt động
- Khách hàng phải kích hoạt lại license
- Mã máy hiển thị là của máy bạn, không phải của khách hàng

## Giải Pháp
Sử dụng 2 script để bảo toàn MachineID:

### Bước 1: Trước khi nâng cấp - Lưu MachineID cũ
```bash
node preserve-machine-id.js <customerName>
```

**Ví dụ:**
```bash
node preserve-machine-id.js anhVu
```

**Kết quả:**
- Đọc license cũ từ `customer-packages/anhVu/.license`
- Lấy MachineID từ license
- Lưu vào file `customer-packages/anhVu/.machine-id`

### Bước 2: Nâng cấp package
- Cập nhật code
- Cập nhật dependencies
- Rebuild package

### Bước 3: Sau khi nâng cấp - Khôi phục MachineID
```bash
node restore-machine-id.js <customerName>
```

**Ví dụ:**
```bash
node restore-machine-id.js anhVu
```

**Kết quả:**
- Đọc MachineID cũ từ file `.machine-id`
- Tạo license mới với MachineID cũ
- Lưu license vào `.license`
- Xóa file `.machine-id` (dọn dẹp)

### Bước 4: Gửi package cho khách hàng
- Package đã có license mới với MachineID cũ
- Khách hàng không cần kích hoạt lại
- License sẽ hoạt động ngay lập tức

## Quy Trình Hoàn Chỉnh

```
1. Khách hàng đang sử dụng package cũ
   ↓
2. Bạn chạy: node preserve-machine-id.js anhVu
   (Lưu MachineID cũ)
   ↓
3. Bạn nâng cấp package
   ↓
4. Bạn chạy: node restore-machine-id.js anhVu
   (Khôi phục MachineID cũ vào license mới)
   ↓
5. Bạn gửi package nâng cấp cho khách hàng
   ↓
6. Khách hàng sử dụng ngay, không cần kích hoạt lại
```

## Các File Liên Quan

- `preserve-machine-id.js` - Lưu MachineID cũ
- `restore-machine-id.js` - Khôi phục MachineID cũ
- `customer-packages/<name>/.machine-id` - File tạm lưu MachineID (tự động xóa)
- `customer-packages/<name>/.license` - File license hiện tại
- `customer-packages/<name>/LICENSE_KEY.txt` - Thông tin license cho khách hàng

## Lưu Ý

⚠️ **Quan trọng:**
- Chạy `preserve-machine-id.js` **TRƯỚC** khi nâng cấp
- Chạy `restore-machine-id.js` **SAU** khi nâng cấp xong
- Không xóa file `.machine-id` thủ công, script sẽ tự động xóa
- Nếu quên chạy `preserve-machine-id.js`, khách hàng sẽ phải kích hoạt lại

## Troubleshooting

### Lỗi: "No preserved Machine ID found"
**Nguyên nhân:** Quên chạy `preserve-machine-id.js` trước khi nâng cấp

**Giải pháp:**
- Nếu vẫn có package cũ: Chạy `preserve-machine-id.js` trên package cũ
- Nếu không có: Yêu cầu khách hàng gửi lại package cũ

### Lỗi: "Invalid license format"
**Nguyên nhân:** File `.license` bị hỏng hoặc không tồn tại

**Giải pháp:**
- Kiểm tra file `customer-packages/<name>/.license` có tồn tại không
- Nếu không, yêu cầu khách hàng kích hoạt license trước

### License không hoạt động sau nâng cấp
**Nguyên nhân:** Quên chạy `restore-machine-id.js`

**Giải pháp:**
- Chạy `restore-machine-id.js` ngay
- Gửi package mới cho khách hàng

## Tự Động Hóa (Tùy Chọn)

Bạn có thể tạo script batch để tự động hóa:

```batch
@echo off
set CUSTOMER=%1
if "%CUSTOMER%"=="" (
    echo Usage: upgrade.bat ^<customerName^>
    exit /b 1
)

echo Step 1: Preserving Machine ID...
node preserve-machine-id.js %CUSTOMER%

echo.
echo Step 2: Upgrade package manually (update code, rebuild, etc.)
echo Press any key when done...
pause

echo.
echo Step 3: Restoring Machine ID...
node restore-machine-id.js %CUSTOMER%

echo.
echo Done! Package is ready to send to customer.
```

Lưu thành `upgrade.bat` và chạy:
```bash
upgrade.bat anhVu
```
