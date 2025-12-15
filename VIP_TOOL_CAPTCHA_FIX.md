# VIP Tool Captcha Fix - Tóm Tắt Thay Đổi

## Vấn Đề
VIP Tool chưa có logic xử lý captcha như NOHU Tool. Captcha API từ core được sử dụng tốt ở NOHU nhưng chưa được tích hợp vào VIP Tool.

## Giải Pháp
Tích hợp captcha-solver từ core vào VIP Tool, tương tự cách NOHU Tool làm.

## Các Thay Đổi

### 1. **tools/vip-tool/vip-automation.js**

#### a) Constructor - Thêm scripts object
```javascript
constructor(settings, scripts) {
    this.settings = settings;
    this.scripts = scripts; // { captchaSolver }
    // ...
}
```

#### b) Thêm method `injectScripts(page)`
- Inject `captcha-solver.js` vào page
- Inject Puppeteer API helper để bypass CORS
- Cho phép CaptchaSolver hoạt động trong page context

#### c) Cải thiện method `solveCaptchaOnPage(page, apiKey)`
- Tìm captcha image với retry logic (5 lần)
- Gọi CaptchaSolver.solveImageCaptcha() từ page context
- Fill captcha input với multiple selector fallbacks
- Xử lý error gracefully

#### d) Cập nhật `registerStep()`
- Gọi `injectScripts()` trước khi fill form
- Gọi `solveCaptchaOnPage()` với apiKey từ settings
- Xử lý captcha solve failure mà không dừng flow
- **Thêm logic check token trước khi redirect**:
  - Kiểm tra token trong cookies hoặc localStorage
  - Retry tối đa 10 lần (5 giây)
  - Chỉ redirect sau khi có token hoặc timeout

#### e) Cập nhật `addBankOKVIP()` và `addBankKJC()`
- Thêm logic check token trước khi redirect
- Kiểm tra token sau khi submit form
- Retry tối đa 10 lần (5 giây)

### 2. **dashboard/server.js** - Endpoint `/api/vip-automation/run`

#### a) Khởi tạo VIPAutomation với scripts và settings
```javascript
// Read extension scripts (like nohu-tool)
const captchaSolver = fs.readFileSync(
    path.join(__dirname, '../tools/nohu-tool/extension/captcha-solver.js'), 
    'utf8'
);

const scripts = {
    captchaSolver
};

// Get API key từ profileData (được gửi từ UI, lấy từ localStorage)
const apiKey = profileData?.apiKey || process.env.CAPTCHA_API_KEY;

const settings = {
    captchaApiKey: apiKey
};

const vipAutomation = new VIPAutomation(settings, scripts);
```

### 3. **dashboard/tools-ui/vip/vip.html** - UI Form

#### a) Load API Key Manager
```html
<script src="core/api-key-manager.js"></script>
```

#### b) Lấy API key từ apiKeyManager (hoặc localStorage fallback)
```javascript
const apiKey = typeof apiKeyManager !== 'undefined' 
    ? apiKeyManager.get() 
    : localStorage.getItem('hidemium_global_api_key') || '';

const profileData = {
    // ... other fields
    apiKey: apiKey
};
```

#### c) Validate API key trước khi chạy
- Kiểm tra API key có tồn tại không
- Hiển thị warning nếu thiếu API key
- Hướng dẫn user lấy API key từ autocaptcha.pro

**API Key Storage**:
- Được lưu ở localStorage với key: `hidemium_global_api_key`
- Được quản lý bởi `apiKeyManager` (core/api-key-manager.js)
- Chung cho tất cả tools (NOHU, VIP, SMS, etc.)

## Cách Hoạt Động

1. **UI**: User nhập form và click START
   - Lấy API key từ `apiKeyManager.get()` (được lưu ở sidebar)
   - API key được lưu ở localStorage với key `hidemium_global_api_key`
   - Validate API key trước khi gửi
   - Gửi profileData chứa apiKey lên server

2. **Server**: Nhận request
   - Lấy apiKey từ profileData
   - Tạo settings object với captchaApiKey
   - Khởi tạo VIPAutomation với scripts + settings

3. **Automation**: Chạy register
   - Inject captcha-solver.js vào page
   - Fill form
   - Tìm captcha image
   - Gọi CaptchaSolver.solveImageCaptcha(image)
   - Fill captcha input
   - Submit form
   - **Check token trước khi redirect**:
     - Kiểm tra token trong cookies (`_pat=`, `token=`)
     - Kiểm tra token trong localStorage (`token`, `auth`)
     - Retry tối đa 10 lần (500ms mỗi lần = 5 giây)
     - Nếu có token → redirect
     - Nếu timeout → vẫn redirect (fallback)

4. **Add Bank**: Tương tự register
   - Fill bank form
   - Submit
   - Check token trước khi redirect

## Tương Tự NOHU Tool

- Sử dụng cùng `captcha-solver.js` từ core
- Sử dụng cùng API: `autocaptcha.pro`
- Lấy API key từ localStorage (nơi user lưu)
- Xử lý error tương tự
- Retry logic tương tự

## Testing

Để test captcha solving:
1. Mở VIP Tool UI
2. Thêm Captcha API Key ở sidebar (nếu chưa có)
3. Chạy VIP automation cho category OKVIP
4. Kiểm tra logs để xem captcha được solve hay không

## Notes

- Captcha solving là optional - nếu không có API key hoặc solve fail, flow vẫn tiếp tục
- Hỗ trợ multiple captcha input selectors (formcontrolname, placeholder, name, etc.)
- Retry logic: tìm captcha image tối đa 5 lần với delay 500ms
- Timeout: 30 giây cho mỗi API call
- API key được lưu ở localStorage với key `captchaApiKey`
