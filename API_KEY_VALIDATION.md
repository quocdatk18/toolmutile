# API Key Validation

## Tổng quan

Hệ thống validation API key đã được thêm vào để đảm bảo API key hợp lệ trước khi chạy automation.

## Các tính năng

### 1. Validation Format
- Kiểm tra API key không rỗng
- Kiểm tra độ dài tối thiểu (10 ký tự)
- Kiểm tra ký tự hợp lệ (chỉ chấp nhận a-z, A-Z, 0-9, -, _)

### 2. Validation Balance
- Gọi API autocaptcha.pro để kiểm tra số dư
- Cập nhật số dư vào config
- Cảnh báo nếu số dư thấp (< $1)

### 3. Tự động validate
- Validate trước khi chạy automation
- Validate trước khi đăng ký tài khoản
- Validate trước khi check khuyến mãi

## Cách sử dụng

### Test API key
```bash
# Chạy file BAT
TEST_API_KEY.bat

# Hoặc chạy trực tiếp
node tools/nohu-tool/test-api-validation.js
```

### Trong code

```javascript
const ApiKeyValidator = require('./validate-api-key');

// Quick validation (chỉ kiểm tra format, không gọi API)
const validator = new ApiKeyValidator();
const result = validator.quickValidate('your-api-key');

if (!result.valid) {
    console.error('Invalid API key:', result.error);
}

// Full validation (kiểm tra format + balance)
const fullResult = await validator.validate('your-api-key');

if (!fullResult.valid) {
    console.error('Invalid API key:', fullResult.error);
} else {
    console.log('Balance:', fullResult.balance);
}
```

## Các file liên quan

- `tools/nohu-tool/validate-api-key.js` - Module validation chính
- `tools/nohu-tool/automation.js` - Đã thêm validation vào workflow
- `tools/nohu-tool/automation-actions.js` - Đã thêm validation vào actions
- `tools/nohu-tool/test-api-validation.js` - Script test
- `TEST_API_KEY.bat` - File BAT để test nhanh

## Lỗi thường gặp

### "API key not found"
- Chưa thêm API key vào `config/settings.json`
- Thêm API key trong phần Settings của dashboard

### "API key is too short"
- API key phải có ít nhất 10 ký tự
- Kiểm tra lại API key từ autocaptcha.pro

### "API key contains invalid characters"
- API key chỉ chấp nhận: a-z, A-Z, 0-9, -, _
- Copy lại API key từ trang web

### "Invalid API key" (từ API)
- API key không tồn tại hoặc đã hết hạn
- Tạo API key mới từ autocaptcha.pro

### "Balance is low"
- Số dư API key < $1
- Nạp thêm tiền vào tài khoản autocaptcha.pro

## Cấu trúc config

File `config/settings.json`:
```json
{
  "apiKey": {
    "service": "autocaptcha.pro",
    "key": "your-api-key-here",
    "balance": 0
  }
}
```

## Lưu ý

1. API key được validate 2 lần:
   - Quick validation (format) - không tốn thời gian
   - Full validation (balance) - gọi API, mất 1-2 giây

2. Balance được cập nhật tự động sau mỗi lần validate

3. Nếu balance < $1, automation vẫn chạy nhưng có cảnh báo

4. Validation chỉ kiểm tra format khi chạy actions (không gọi API để tránh chậm)
