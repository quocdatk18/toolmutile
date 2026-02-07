# OKVIP OTP - Bước Đăng Ký (Register)

## Tóm tắt
Bước đăng ký cho category `okvipOtp` đã được hoàn thành. Luồng:
1. Điền form đăng ký (account, password, phone, fullname)
2. Click nút "ĐĂNG KÝ"
3. Chờ token/redirect

## Các thay đổi được thêm

### 1. Category Paths
```javascript
'okvipOtp': {
    withdrawPassword: '/Account/ChangeMoneyPassword',
    bank: '/Financial?type=withdraw'
}
```

### 2. Form Filler - `fillOKVIPOtpRegisterForm`
- Selector: `input[data-input-name="account"]` - tên tài khoản
- Selector: `input[data-input-name="userpass"]` - mật khẩu
- Selector: `input[data-input-name="phone"]` - số điện thoại
- Selector: `input[data-input-name="realName"]` - họ tên

### 3. Submit Button
- ID: `#insideRegisterSubmitClick`
- Text: "ĐĂNG KÝ"

### 4. Sites Configuration
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

## Cách test

### Chạy test script
```bash
cd tools/vip-tool
node test-register-okvipOtp.js
```

### Kết quả mong đợi
- ✅ Form được điền đầy đủ
- ✅ Nút "ĐĂNG KÝ" được click
- ✅ Trả về `{ success: true, message: 'OKVIP OTP registration completed' }`

## Các bước tiếp theo (chưa làm)
1. ❌ Add Bank (addBankOKVIPOtp) - Placeholder đã tạo
2. ❌ Check Promo (checkPromoOKVIPOtp) - Chưa tạo
3. ❌ OTP Verification - Chưa làm

## Ghi chú
- Form sử dụng Vue.js với `data-input-name` attributes
- Không có captcha sau khi fill form
- Không cần xác thực OTP ở bước đăng ký (sẽ làm ở bước Add Bank)
- Luồng giống OKVIP nhưng form khác (data-input-name thay vì formcontrolname)
