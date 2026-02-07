# ✅ OKVIP OTP - Phone Number Format Fix

## Vấn đề
- Viotp API trả về số không có số 0 ở đầu (ví dụ: `921420951`)
- Hàm kiểm tra `phoneNumber.length < 10` → loại bỏ vì chỉ có 9 ký tự
- Kết quả: Tất cả số đều bị loại bỏ, không điền form

## Giải pháp

### 1. Thêm số 0 ở đầu
```javascript
// Nếu số không có số 0 ở đầu, thêm vào
// Ví dụ: 921420951 → 0921420951
if (!phoneNumber.startsWith('0')) {
    phoneNumber = '0' + phoneNumber;
}
```

### 2. Kiểm tra độ dài sau khi thêm 0
```javascript
// Kiểm tra độ dài (phải >= 10 ký tự sau khi thêm 0)
if (phoneNumber.length < 10) {
    console.warn(`⚠️ Phone number too short: ${phoneNumber}`);
    continue;
}
```

## Luồng mới

```
Viotp trả về: 921420951 (9 ký tự)
                ↓
Thêm 0: 0921420951 (10 ký tự)
                ↓
Kiểm tra độ dài: ✅ Hợp lệ
                ↓
Return: 0921420951
```

## Ví dụ

### Trước (Sai)
```
Viotp: 921420951
Kiểm tra: length = 9 < 10 → ❌ Loại bỏ
```

### Sau (Đúng)
```
Viotp: 921420951
Thêm 0: 0921420951
Kiểm tra: length = 10 >= 10 → ✅ Chấp nhận
```

## Logs

### Thành công
```
→ Trying serviceId: 3
📤 Viotp response (serviceId 3): {...,"phone_number":"921420951",...}
✅ Got phone number (serviceId 3): 0921420951
📝 Request ID: 540600938
```

### Thất bại (số quá ngắn)
```
→ Trying serviceId: X
📤 Viotp response (serviceId X): {...,"phone_number":"12345",...}
⚠️ ServiceId X: Phone number too short: 012345
```

## Kiểm tra

```javascript
// Trước
'921420951'.length // 9 → ❌ Loại bỏ

// Sau
'0' + '921420951' // '0921420951'
'0921420951'.length // 10 → ✅ Chấp nhận
```

## Tiếp theo
- Test lại với Viotp API
- Kiểm tra form được điền đúng
- Hoàn thành bước Add Bank
- Hoàn thành bước Check Promo
