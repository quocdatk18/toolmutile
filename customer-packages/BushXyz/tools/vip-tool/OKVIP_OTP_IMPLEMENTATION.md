# OKVIP OTP Category - Implementation Summary

## ✅ Hoàn thành - Bước Đăng Ký (Register)

### Các hàm được thêm/sửa

#### 1. `fillOKVIPOtpRegisterForm(page, profileData)` - Line ~4530
- Điền form đăng ký với selectors `data-input-name`
- Fields: account, userpass, phone, realName
- Trigger events: input, change, blur

#### 2. `registerStep()` - Sửa logic
- Thêm check cho `okvipOtp` trong phần skip captcha
- Thêm check cho `okvipOtp` trong phần skip delay trước submit
- Thêm check cho `okvipOtp` trong phần skip token/redirect wait

#### 3. `addBankStep()` - Thêm routing
- Thêm: `else if (category === 'okvipOtp') return await this.addBankOKVIPOtp(...)`

#### 4. `checkPromoStep()` - Thêm routing
- Thêm: `else if (category === 'okvipOtp') return await this.checkPromoOKVIPOtp(...)`

#### 5. `fillRegisterForm()` - Thêm routing
- Thêm: `else if (category === 'okvipOtp') await this.fillOKVIPOtpRegisterForm(...)`

#### 6. `categoryPaths` - Thêm paths
```javascript
'okvipOtp': {
    withdrawPassword: '/Account/ChangeMoneyPassword',
    bank: '/Financial?type=withdraw'
}
```

#### 7. `getSitesByCategory()` - Thêm sites
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

### Form HTML Analysis
```html
<!-- Account -->
<input data-input-name="account" type="text" placeholder="Nhập Tên tài khoản">

<!-- Password -->
<input data-input-name="userpass" type="password" placeholder="Nhập mật khẩu">

<!-- Phone -->
<input data-input-name="phone" type="tel" placeholder="Nhập SĐT">

<!-- Full Name -->
<input data-input-name="realName" type="text" placeholder="Vui lòng nhập Họ và Tên thật">

<!-- Submit Button -->
<button type="button" id="insideRegisterSubmitClick" class="ui-button ui-button--primary">
    <span class="ui-button__text">ĐĂNG KÝ</span>
</button>
```

## ❌ Chưa hoàn thành

### 1. `addBankOKVIPOtp()` - Placeholder
- Cần hoàn thành logic thêm bank
- Cần xác thực OTP (nếu có)

### 2. `checkPromoOKVIPOtp()` - Chưa tạo
- Cần tạo hàm check promo

### 3. OTP Verification
- Chưa implement xác thực OTP

## Test Files
- `test-register-okvipOtp.js` - Test script cho bước đăng ký
- `OKVIP_OTP_REGISTER_TEST.md` - Hướng dẫn test

## Luồng Hoàn Chỉnh (Dự kiến)
1. ✅ Register - Điền form + submit
2. ⏳ Add Bank - Thêm ngân hàng + xác thực OTP
3. ⏳ Check Promo - Nhận khuyến mãi

## Ghi chú
- Form sử dụng Vue.js (data-input-name attributes)
- Không có captcha sau fill form
- Nút submit có ID cụ thể: `#insideRegisterSubmitClick`
- URL: https://m.sc881.com./home/register
