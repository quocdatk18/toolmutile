# ✅ OKVIP OTP - Viotp Phone Fetching Fix

## Vấn đề
- Hàm `getPhoneFromViotp()` chỉ thử serviceIds `[3, 21]`
- Nếu cả 2 serviceIds này không có số, sẽ trả về lỗi
- Lấy được số "0" (không hợp lệ)

## Giải pháp

### 1. Thêm nhiều serviceIds
```javascript
async getPhoneFromViotp(viotpToken, serviceIds = [3, 21, 1, 2, 4, 5])
```
- Default serviceIds: `[3, 21, 1, 2, 4, 5]`
- Thử lần lượt từ serviceId 3 → 21 → 1 → 2 → 4 → 5
- Nếu một serviceId có số, sẽ trả về ngay

### 2. Kiểm tra số hợp lệ
```javascript
if (!phoneNumber || phoneNumber === '0' || phoneNumber.length < 10) {
    console.warn(`⚠️ Invalid phone number: ${phoneNumber}`);
    continue; // Try next serviceId
}
```
- Không lấy số "0"
- Không lấy số quá ngắn (< 10 ký tự)
- Tiếp tục thử serviceId tiếp theo

## Luồng mới

```
┌─────────────────────────────────────────┐
│ getPhoneFromViotp()                     │
├─────────────────────────────────────────┤
│ Thử serviceIds: [3, 21, 1, 2, 4, 5]    │
│                                         │
│ Cho mỗi serviceId:                      │
│ 1. Gọi Viotp API                        │
│ 2. Kiểm tra response status             │
│ 3. Kiểm tra số hợp lệ                   │
│    ├─ Hợp lệ: Return                    │
│    └─ Không: Thử serviceId tiếp theo    │
│                                         │
│ Nếu tất cả thất bại: Return null        │
└─────────────────────────────────────────┘
```

## Logs

### Thành công
```
📱 Requesting phone number from Viotp API (serviceIds: 3, 21, 1, 2, 4, 5)...
  → Trying serviceId: 3
  📤 Viotp response (serviceId 3): {...}
  ⚠️ ServiceId 3 failed: No available phone numbers
  → Trying serviceId: 21
  📤 Viotp response (serviceId 21): {...}
  ⚠️ ServiceId 21 failed: No available phone numbers
  → Trying serviceId: 1
  📤 Viotp response (serviceId 1): {...}
✅ Got phone number (serviceId 1): 0987654321
📝 Request ID: xxx
```

### Thất bại
```
❌ All serviceIds failed
```

## Khác biệt với AccOKVIP

| Tính năng | AccOKVIP | OKVIP OTP |
|----------|----------|-----------|
| ServiceIds | [3, 21] | [3, 21, 1, 2, 4, 5] |
| Kiểm tra số hợp lệ | ❌ Không | ✅ Có |
| Lấy OTP | ✅ Có | ❌ Không |

## Cách sử dụng

### Tự động (API)
```javascript
const phoneResult = await this.getPhoneFromViotp(viotpToken);
// Sẽ thử tất cả serviceIds cho đến khi thành công
```

### Chỉ định serviceIds
```javascript
const phoneResult = await this.getPhoneFromViotp(viotpToken, [3, 21]);
// Chỉ thử serviceId 3 và 21
```

## Test

```bash
cd tools/vip-tool
node test-register-okvipOtp.js
```

Kết quả mong đợi:
- ✅ Lấy được số điện thoại hợp lệ
- ✅ Điền vào form
- ✅ Submit thành công
