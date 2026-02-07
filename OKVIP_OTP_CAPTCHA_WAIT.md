# ✅ OKVIP OTP - Chờ Giải Captcha Sau Submit

## Tóm tắt
Sau khi click nút "ĐĂNG KÝ", hệ thống sẽ **chờ người dùng giải captcha** trước khi tiếp tục.

## Cách hoạt động

### 1. Submit Form
```javascript
submitBtn.click(); // Click nút "ĐĂNG KÝ"
await new Promise(r => setTimeout(r, 5000)); // Chờ 5 giây
```

### 2. Chờ Captcha
```javascript
console.log(`🔐 OKVIP OTP: Waiting for captcha to be solved...`);
console.log(`⏳ Please solve the captcha manually...`);
```

### 3. Kiểm tra Captcha Đã Giải
Hệ thống kiểm tra 3 cách:

**Cách 1: URL thay đổi**
```javascript
const currentUrl = page.url();
if (!currentUrl.includes('register') && !currentUrl.includes('home')) {
    // URL đã thay đổi → Captcha đã giải
}
```

**Cách 2: Token trong Storage**
```javascript
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token) {
    // Token tìm thấy → Captcha đã giải
}
```

**Cách 3: Success Message**
```javascript
const successKeywords = ['thành công', 'success', 'đăng ký thành công'];
const allText = document.body.innerText.toLowerCase();
if (successKeywords.some(keyword => allText.includes(keyword))) {
    // Success message tìm thấy → Captcha đã giải
}
```

## Luồng

```
┌─────────────────────────────────────────┐
│ 1. Click nút "ĐĂNG KÝ"                  │
├─────────────────────────────────────────┤
│ 2. Chờ 5 giây                           │
├─────────────────────────────────────────┤
│ 3. Chờ người dùng giải captcha          │
│    (Tối đa 5 phút)                      │
├─────────────────────────────────────────┤
│ 4. Kiểm tra 3 cách:                     │
│    ├─ URL thay đổi?                     │
│    ├─ Token trong storage?              │
│    └─ Success message?                  │
├─────────────────────────────────────────┤
│ 5. Nếu tìm thấy → Tiếp tục              │
│    Nếu timeout → Lỗi                    │
└─────────────────────────────────────────┘
```

## Timeout

- **Thời gian chờ**: 5 phút (300 giây)
- **Kiểm tra mỗi**: 1 giây
- **Log mỗi**: 30 giây

### Logs
```
🔐 OKVIP OTP: Waiting for captcha to be solved...
⏳ Please solve the captcha manually...
⏳ Waiting for captcha... (0 minutes)
⏳ Waiting for captcha... (1 minutes)
⏳ Waiting for captcha... (2 minutes)
...
✅ URL changed to: https://m.sc881.com./home/dashboard - Captcha likely solved
✅ OKVIP OTP registration completed (captcha solved)
```

## Lỗi Handling

### Timeout
```
⚠️ Timeout waiting for captcha (5 minutes)
❌ Timeout waiting for captcha
```

### Không tìm thấy captcha
- Hệ thống sẽ tiếp tục chờ cho đến khi timeout

## Ví dụ Logs

### Thành công
```
📝 Submitting registration form for SC881...
🔐 OKVIP OTP: Waiting for captcha to be solved...
⏳ Please solve the captcha manually...
⏳ Waiting for captcha... (0 minutes)
✅ URL changed to: https://m.sc881.com./home/dashboard - Captcha likely solved
✅ OKVIP OTP registration completed (captcha solved)
```

### Timeout
```
📝 Submitting registration form for SC881...
🔐 OKVIP OTP: Waiting for captcha to be solved...
⏳ Please solve the captcha manually...
⏳ Waiting for captcha... (0 minutes)
⏳ Waiting for captcha... (1 minutes)
⏳ Waiting for captcha... (2 minutes)
⏳ Waiting for captcha... (3 minutes)
⏳ Waiting for captcha... (4 minutes)
⏳ Waiting for captcha... (5 minutes)
⚠️ Timeout waiting for captcha (5 minutes)
❌ Timeout waiting for captcha
```

## Tóm tắt
✅ Chờ người dùng giải captcha
✅ Kiểm tra 3 cách để xác nhận
✅ Timeout 5 phút
✅ Log chi tiết mỗi 30 giây
✅ Xử lý lỗi đầy đủ
