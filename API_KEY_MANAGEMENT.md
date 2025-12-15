# API Key Management - Hướng Dẫn Toàn Bộ

## Cấu Trúc

### 1. Core Module: `core/api-key-manager.js`
```javascript
class ApiKeyManager {
    storageKey = 'hidemium_global_api_key';  // localStorage key
    
    save(apiKey)      // Lưu API key
    get()             // Lấy API key
    clear()           // Xóa API key
    checkBalance()    // Kiểm tra số dư
    getInfo()         // Lấy thông tin API key
}

// Export singleton
window.apiKeyManager = new ApiKeyManager();
```

### 2. Storage Location
- **localStorage key**: `hidemium_global_api_key`
- **Scope**: Chung cho tất cả tools (NOHU, VIP, SMS, etc.)
- **Persistence**: Lưu trữ vĩnh viễn (không expire)

### 3. Cách Sử Dụng Trong Tools

#### NOHU Tool
```javascript
// Load API Key Manager
<script src="core/api-key-manager.js"></script>

// Lấy API key
const apiKey = apiKeyManager.get();

// Validate
if (!apiKey || apiKey.trim() === '') {
    alert('Vui lòng thêm API Key ở sidebar');
    return;
}

// Gửi lên server
const config = {
    apiKey: apiKey,
    // ... other fields
};
```

#### VIP Tool (Tương Tự)
```javascript
// Load API Key Manager
<script src="core/api-key-manager.js"></script>

// Lấy API key (với fallback)
const apiKey = typeof apiKeyManager !== 'undefined' 
    ? apiKeyManager.get() 
    : localStorage.getItem('hidemium_global_api_key') || '';

// Validate
if (!apiKey || apiKey.trim() === '') {
    alert('Vui lòng thêm API Key ở sidebar');
    return;
}

// Gửi lên server
const profileData = {
    apiKey: apiKey,
    // ... other fields
};
```

### 4. Server Side (dashboard/server.js)

#### Lấy API key từ profileData
```javascript
const apiKey = profileData?.apiKey || process.env.CAPTCHA_API_KEY;

const settings = {
    captchaApiKey: apiKey
};

const automation = new VIPAutomation(settings, scripts);
```

### 5. Automation Side (tools/vip-tool/vip-automation.js)

#### Sử dụng API key từ settings
```javascript
constructor(settings, scripts) {
    this.settings = settings;  // { captchaApiKey: "..." }
    this.scripts = scripts;
}

async registerStep(browser, category, siteConfig, profileData) {
    const apiKey = this.settings?.captchaApiKey;
    
    if (apiKey) {
        const captchaSolved = await this.solveCaptchaOnPage(page, apiKey);
    }
}
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI (vip.html)                                            │
│    - Load apiKeyManager                                     │
│    - User thêm API key ở sidebar                            │
│    - API key lưu ở localStorage: hidemium_global_api_key    │
│    - User click START                                       │
│    - Lấy API key: apiKeyManager.get()                       │
│    - Gửi profileData { apiKey, username, ... }             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Server (dashboard/server.js)                             │
│    - Nhận profileData từ request                            │
│    - Lấy apiKey từ profileData.apiKey                       │
│    - Tạo settings { captchaApiKey: apiKey }                 │
│    - Khởi tạo VIPAutomation(settings, scripts)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Automation (tools/vip-tool/vip-automation.js)            │
│    - Nhận settings từ constructor                           │
│    - Lấy apiKey từ this.settings.captchaApiKey              │
│    - Inject captcha-solver.js vào page                      │
│    - Gọi CaptchaSolver.solveImageCaptcha(image, apiKey)     │
│    - Fill captcha input                                     │
│    - Submit form                                            │
└─────────────────────────────────────────────────────────────┘
```

## Checklist

- [x] API key được lưu ở localStorage với key `hidemium_global_api_key`
- [x] apiKeyManager được load trong vip.html
- [x] API key được lấy từ apiKeyManager.get()
- [x] API key được validate trước khi gửi
- [x] API key được gửi trong profileData
- [x] Server lấy API key từ profileData.apiKey
- [x] Server tạo settings với captchaApiKey
- [x] Automation nhận settings từ constructor
- [x] Automation sử dụng apiKey từ settings.captchaApiKey
- [x] CaptchaSolver được inject vào page
- [x] CaptchaSolver.solveImageCaptcha() được gọi với apiKey

## Troubleshooting

### API key không được lấy
- Kiểm tra localStorage có key `hidemium_global_api_key` không
- Kiểm tra apiKeyManager được load không
- Kiểm tra console log: `✅ API Key found: ...`

### Captcha không được solve
- Kiểm tra API key có hợp lệ không
- Kiểm tra API key có credit không (checkBalance)
- Kiểm tra captcha image được tìm thấy không
- Kiểm tra CaptchaSolver được inject vào page không

### Server không nhận API key
- Kiểm tra profileData được gửi lên không
- Kiểm trace request body có chứa apiKey không
- Kiểm tra server log: `🔑 API Key available: YES/NO`
