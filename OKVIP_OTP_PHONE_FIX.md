# ✅ OKVIP OTP - Phone Number Fix (Bỏ Số 0 Đầu)

## Vấn đề
Form OKVIP OTP chỉ nhận **9 số** (không có số 0 đầu), nhưng Viotp API trả về số có thể có hoặc không có số 0 đầu.

**Ví dụ:**
- Viotp trả về: `0987654321` (10 số)
- Form cần: `987654321` (9 số)

## Giải pháp
Hàm `fillOKVIPOtpRegisterForm()` đã được cập nhật để **tự động bỏ số 0 đầu** nếu có.

## Cách hoạt động

### 1. Lấy số từ Viotp API
```javascript
const phoneResult = await this.getPhoneFromViotp(viotpToken);
let phone = phoneResult.phoneNumber; // Ví dụ: "0987654321"
```

### 2. Bỏ số 0 đầu
```javascript
if (phone.startsWith('0')) {
    phone = phone.substring(1); // "0987654321" → "987654321"
    console.log(`✅ Removed leading 0: ${phoneResult.phoneNumber} → ${phone}`);
}
```

### 3. Điền vào form
```javascript
profileData.phone = phone; // "987654321"
phoneInput.value = data.phone; // Điền 9 số vào form
```

## Luồng

```
┌─────────────────────────────────────────┐
│ fillOKVIPOtpRegisterForm()              │
├─────────────────────────────────────────┤
│ 1. Kiểm tra simMode                     │
│    ├─ api: Lấy từ Viotp                 │
│    └─ manual: Dùng số người dùng nhập   │
│                                         │
│ 2. Xóa số 0 đầu (nếu có)                │
│    ├─ "0987654321" → "987654321"        │
│    └─ "987654321" → "987654321"         │
│                                         │
│ 3. Điền vào form (9 số)                 │
│    └─ phoneInput.value = "987654321"    │
└─────────────────────────────────────────┘
```

## Logs

### API Mode
```
📱 OKVIP OTP: Fetching phone number from Viotp API...
✅ Removed leading 0: 0987654321 → 987654321
✅ Got phone from Viotp: 987654321 (9 digits)
✅ Phone filled: 987654321 (9 digits)
```

### Manual Mode
```
✅ Removed leading 0 from manual phone: 0987654321 → 987654321
✏️ Using manual phone: 987654321 (9 digits)
✅ Phone filled: 987654321 (9 digits)
```

## Xử lý lỗi

### Nếu không có số
```
❌ Vui lòng nhập số điện thoại!
```

### Nếu Viotp API thất bại
```
❌ Viotp API: Hiện không có sẵn số điện thoại phù hợp. Vui lòng thử lại sau!
```

## Kiểm tra

### Trước fix
- Viotp: `0987654321` → Form: `0987654321` ❌ (10 số, form không chấp nhận)

### Sau fix
- Viotp: `0987654321` → Form: `987654321` ✅ (9 số, form chấp nhận)
- Manual: `0987654321` → Form: `987654321` ✅ (9 số, form chấp nhận)
- Manual: `987654321` → Form: `987654321` ✅ (9 số, form chấp nhận)

## Tóm tắt
✅ Tự động bỏ số 0 đầu từ Viotp API
✅ Tự động bỏ số 0 đầu từ input manual
✅ Luôn điền đúng 9 số vào form
✅ Xử lý lỗi đầy đủ
