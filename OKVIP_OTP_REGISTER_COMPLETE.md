# ✅ OKVIP OTP - Bước Đăng Ký Hoàn Thành

## Tóm tắt
Bước đăng ký (Register) cho category `okvipOtp` đã được hoàn thành. Hệ thống có thể:
- Điền form đăng ký tự động
- Submit form
- Chờ token/redirect

## Các thay đổi chính

### 1. Thêm hàm `fillOKVIPOtpRegisterForm()`
```javascript
async fillOKVIPOtpRegisterForm(page, profileData)
```
- Điền các field: account, userpass, phone, realName
- Sử dụng selectors: `input[data-input-name="..."]`
- Trigger events: input, change, blur

### 2. Cập nhật `registerStep()`
- Skip captcha cho okvipOtp
- Skip delay trước submit cho okvipOtp
- Skip token/redirect wait cho okvipOtp

### 3. Thêm routing cho okvipOtp
- `addBankStep()` → `addBankOKVIPOtp()`
- `checkPromoStep()` → `checkPromoOKVIPOtp()`
- `fillRegisterForm()` → `fillOKVIPOtpRegisterForm()`

### 4. Thêm category paths
```javascript
'okvipOtp': {
    withdrawPassword: '/Account/ChangeMoneyPassword',
    bank: '/Financial?type=withdraw'
}
```

### 5. Thêm sites configuration
```javascript
'okvipOtp': {
    name: 'OKVIP OTP',
    icon: 'OTP',
    color: '#ff6b35',
    sites: [
        {
            name: 'SC881',
            registerUrl: 'https://m.sc881.com./home/register',
            checkPromoUrl: 'https://m.sc881.com./home/event/detail?current=1&template=1&eventId=1'
        }
    ]
}
```

## Form Details

### Selectors
| Field | Selector | Type |
|-------|----------|------|
| Account | `input[data-input-name="account"]` | text |
| Password | `input[data-input-name="userpass"]` | password |
| Phone | `input[data-input-name="phone"]` | tel |
| Full Name | `input[data-input-name="realName"]` | text |
| Submit | `#insideRegisterSubmitClick` | button |

### URL
- Register: `https://m.sc881.com./home/register`
- Promo: `https://m.sc881.com./home/event/detail?current=1&template=1&eventId=1`

## Test
```bash
cd tools/vip-tool
node test-register-okvipOtp.js
```

## Bước tiếp theo
1. Hoàn thành `addBankOKVIPOtp()` - Thêm ngân hàng
2. Hoàn thành `checkPromoOKVIPOtp()` - Nhận khuyến mãi
3. Implement OTP verification (nếu cần)

## Files
- `tools/vip-tool/vip-automation.js` - Main implementation
- `tools/vip-tool/test-register-okvipOtp.js` - Test script
- `tools/vip-tool/OKVIP_OTP_REGISTER_TEST.md` - Test guide
- `tools/vip-tool/OKVIP_OTP_IMPLEMENTATION.md` - Implementation details
