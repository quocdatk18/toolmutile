# API Key Validation - UI Dashboard

## Tổng quan

Đã thêm validation API key vào UI Dashboard để kiểm tra API key trước khi chạy automation.

## Các tính năng đã thêm

### 1. Validation khi lưu API Key
- Kiểm tra format ngay khi người dùng click "Lưu"
- Hiển thị lỗi cụ thể nếu format không hợp lệ
- Tự động kiểm tra balance sau khi lưu thành công

### 2. Validation khi kiểm tra Balance
- Kiểm tra format trước khi gọi API
- Hiển thị trạng thái "Đang kiểm tra..."
- Cảnh báo nếu số dư < $1
- Cập nhật badge trạng thái (✅ Active / ❌ Invalid)

### 3. Validation trước khi chạy Automation
- Kiểm tra API key tồn tại
- Kiểm tra format hợp lệ
- Hiển thị lỗi chi tiết nếu không hợp lệ
- Áp dụng cho tất cả actions:
  - ✅ Tự động (Full sequence)
  - ✅ Đăng ký
  - ✅ Đăng nhập
  - ✅ Check khuyến mãi

## Quy tắc validation

### Format hợp lệ:
- ✅ Độ dài tối thiểu: 10 ký tự
- ✅ Ký tự cho phép: a-z, A-Z, 0-9, -, _
- ✅ Không chứa khoảng trắng
- ✅ Không chứa ký tự đặc biệt khác

### Ví dụ:
```
✅ Hợp lệ:
- abc123def456
- test-api-key-2024
- my_api_key_123

❌ Không hợp lệ:
- abc123 (quá ngắn)
- api key 123 (có khoảng trắng)
- api@key#123 (ký tự đặc biệt)
- (trống)
```

## Các file đã cập nhật

### 1. `dashboard/dashboard.js`
- Thêm hàm `validateApiKeyFormat()` - Validation client-side
- Cập nhật `saveGlobalApiKey()` - Validate trước khi lưu
- Cập nhật `checkGlobalBalance()` - Validate + hiển thị trạng thái

### 2. `dashboard/tools-ui/nohu-tool.html`
- Thêm hàm `validateApiKeyFormat()` (copy từ dashboard.js)
- Cập nhật `runAutoSequence()` - Validate trước khi chạy
- Cập nhật `runRegisterOnly()` - Validate trước khi đăng ký
- Cập nhật `runLoginOnly()` - Validate trước khi đăng nhập

### 3. Backend validation (đã có sẵn)
- `tools/nohu-tool/validate-api-key.js` - Module validation server-side
- `tools/nohu-tool/automation.js` - Validate trước workflow
- `tools/nohu-tool/automation-actions.js` - Validate trước actions

## Luồng validation

```
User nhập API Key
    ↓
Click "Lưu"
    ↓
[Client] Validate format ← Lỗi → Hiển thị lỗi
    ↓ OK
Lưu vào config
    ↓
Click "Kiểm tra"
    ↓
[Client] Validate format ← Lỗi → Hiển thị lỗi
    ↓ OK
[Server] Gọi API autocaptcha.pro
    ↓
Kiểm tra balance ← Lỗi → API key không hợp lệ
    ↓ OK
Hiển thị số dư + cảnh báo nếu thấp
    ↓
Click "Chạy Automation"
    ↓
[Client] Validate format ← Lỗi → Hiển thị lỗi
    ↓ OK
[Server] Validate lại (quick check)
    ↓ OK
Chạy automation
```

## Thông báo lỗi

### Lỗi format:
- "API key không được để trống"
- "API key quá ngắn (tối thiểu 10 ký tự)"
- "API key chứa ký tự không hợp lệ (chỉ chấp nhận a-z, A-Z, 0-9, -, _)"

### Lỗi API:
- "API Key không hợp lệ" (từ autocaptcha.pro)
- "Số dư thấp" (< $1)

### Lỗi thiếu:
- "Thiếu API Key - Vui lòng thêm Captcha API Key ở sidebar trước khi chạy!"

## Cách test

### 1. Test validation format
```
1. Mở Dashboard
2. Nhập API key không hợp lệ:
   - "abc" (quá ngắn)
   - "api key 123" (có khoảng trắng)
   - "api@key" (ký tự đặc biệt)
3. Click "Lưu"
4. Kiểm tra thông báo lỗi
```

### 2. Test validation balance
```
1. Nhập API key hợp lệ
2. Click "Kiểm tra"
3. Xem trạng thái:
   - ✅ Nếu API key đúng → Hiển thị số dư
   - ❌ Nếu API key sai → Hiển thị lỗi
```

### 3. Test validation automation
```
1. Không nhập API key
2. Click "Chạy Tự Động"
3. Kiểm tra thông báo: "Thiếu API Key"

4. Nhập API key không hợp lệ
5. Click "Chạy Tự Động"
6. Kiểm tra thông báo: "API Key không hợp lệ"
```

## UI/UX Improvements

### Badge trạng thái API Key:
- 🔑 No API Key (xám)
- ✅ API Key Active (xanh)
- ❌ API Key Invalid (đỏ)

### Loading state:
- "⏳ Đang kiểm tra..." khi check balance

### Toast notifications:
- ✅ Success: Xanh lá
- ⚠️ Warning: Vàng (số dư thấp)
- ❌ Error: Đỏ (lỗi validation)

## Lưu ý

1. **Client-side validation** (nhanh, không cần network):
   - Kiểm tra format
   - Kiểm tra độ dài
   - Kiểm tra ký tự

2. **Server-side validation** (chậm hơn, cần network):
   - Kiểm tra API key có tồn tại
   - Kiểm tra số dư
   - Cập nhật balance vào config

3. **Validation được thực hiện ở 3 thời điểm**:
   - Khi lưu API key
   - Khi kiểm tra balance
   - Trước khi chạy automation

4. **Không block user nếu số dư thấp**:
   - Chỉ cảnh báo
   - Vẫn cho phép chạy automation
   - User tự quyết định

## Tương lai

### Có thể thêm:
- [ ] Auto-check balance khi mở dashboard
- [ ] Hiển thị balance trên badge
- [ ] Cảnh báo khi balance < $5
- [ ] Link nhanh đến trang nạp tiền
- [ ] History sử dụng API key
- [ ] Multiple API keys support
