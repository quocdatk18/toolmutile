# ✅ OKVIP OTP - Viotp Phone Fetching Thêm Vào

## Tóm tắt
Hàm `fillOKVIPOtpRegisterForm()` đã được cập nhật để lấy số điện thoại từ Viotp API (giống AccOKVIP), nhưng **chỉ lấy số để điền vào form, không lấy OTP**.

## Cách hoạt động

### 1. Kiểm tra simMode
```javascript
if (profileData.simMode === 'api' && !profileData.phone)
```
- Nếu `simMode = 'api'` và chưa có số điện thoại
- Gọi Viotp API để lấy số

### 2. Lấy số từ Viotp
```javascript
const phoneResult = await this.getPhoneFromViotp(viotpToken);
if (phoneResult && phoneResult.phoneNumber) {
    profileData.phone = phoneResult.phoneNumber;
    profileData.viotpRequestId = phoneResult.requestId;
}
```
- Gọi hàm `getPhoneFromViotp()` (đã có sẵn)
- Lưu số điện thoại vào `profileData.phone`
- Lưu requestId vào `profileData.viotpRequestId` (để dùng sau nếu cần)

### 3. Điền vào form
```javascript
phoneInput.value = data.phone || '';
```
- Điền số điện thoại vào field `input[data-input-name="phone"]`

## Luồng

```
┌─────────────────────────────────────────┐
│ fillOKVIPOtpRegisterForm()              │
├─────────────────────────────────────────┤
│ 1. Kiểm tra simMode = 'api'?            │
│    ├─ Có: Gọi Viotp API                 │
│    └─ Không: Dùng số có sẵn             │
│                                         │
│ 2. Lấy số từ Viotp                      │
│    ├─ Thành công: Lưu vào profileData   │
│    └─ Thất bại: Dùng manual input       │
│                                         │
│ 3. Điền form                            │
│    ├─ Account (username)                │
│    ├─ Password                          │
│    ├─ Phone (từ Viotp hoặc manual)      │
│    └─ Full Name                         │
└─────────────────────────────────────────┘
```

## Khác biệt với AccOKVIP

| Tính năng | AccOKVIP | OKVIP OTP |
|----------|----------|-----------|
| Lấy số từ Viotp | ✅ Có | ✅ Có |
| Lấy OTP | ✅ Có | ❌ Không |
| Xác thực OTP | ✅ Có | ❌ Không (làm sau) |
| Điền form | ✅ Có | ✅ Có |

## Cấu hình

### Viotp Token
```javascript
const viotpToken = this.settings?.viotpToken || process.env.VIOTP_TOKEN;
```
- Lấy từ `settings.viotpToken` hoặc env var `VIOTP_TOKEN`

### Sim Mode
```javascript
// UI: Select simMode
<select id="simMode">
    <option value="api">📱 API SIM</option>
    <option value="manual">✏️ Điền SĐT</option>
</select>
```
- `api`: Lấy số từ Viotp API
- `manual`: Người dùng điền số

## Lỗi Handling

### Nếu không có Viotp token
```
⚠️ No Viotp token provided, using manual input
```
- Sẽ dùng số có sẵn trong `profileData.phone`

### Nếu Viotp API thất bại
```
⚠️ Failed to get phone from Viotp, using manual input
```
- Sẽ dùng số có sẵn trong `profileData.phone`

## Logs

```
📱 OKVIP OTP: Fetching phone number from Viotp API...
✅ Got phone from Viotp: 0987654321
✅ Account filled: testuser123
✅ Password filled
✅ Phone filled: 0987654321
✅ Full name filled: TEST USER
✅ OKVIP OTP form filled successfully
```

## Tiếp theo
- Test bước đăng ký với Viotp API
- Hoàn thành bước Add Bank
- Hoàn thành bước Check Promo
