# 🔐 TÍNH NĂNG ĐĂNG NHẬP TỰ ĐỘNG

## 🎯 Tính năng

Tool tự động đăng nhập sử dụng thông tin từ lần đăng ký, không cần nhập lại form.

## ✅ Cách hoạt động

### 1. Lưu thông tin khi đăng ký
```javascript
// Khi user click "Đăng Ký"
chrome.storage.local.set({
  lastUsername: username,
  lastPassword: password
});
```

### 2. Tự động lấy thông tin khi đăng nhập
```javascript
// Khi mở tab "Đăng Nhập"
chrome.storage.local.get(['lastUsername', 'lastPassword'], (result) => {
  // Hiển thị thông tin đã lưu
  // Enable button nếu có thông tin
});
```

### 3. Tự động điền form và submit
```javascript
// Content script tự động:
- Tìm input username & password
- Điền thông tin
- Click button đăng nhập
```

## 📋 Hướng dẫn sử dụng

### Bước 1: Đăng ký tài khoản (lần đầu)
1. Mở tab "Đăng Ký"
2. Điền thông tin
3. Click "Đăng Ký Tự Động"
4. ✅ Thông tin được lưu tự động

### Bước 2: Đăng nhập (lần sau)
1. Mở tab "Đăng Nhập"
2. Thông tin tự động hiển thị
3. Chọn các trang muốn đăng nhập
4. Click "Đăng Nhập Tự Động"
5. ✅ Tool tự động mở tab và đăng nhập

## 🔧 Cấu trúc code

### Popup.html
```html
<!-- Login Tab -->
<div class="tab" id="loginTab">Đăng Nhập</div>

<!-- Login Form -->
<div id="loginForm" style="display: none;">
  <!-- Hiển thị thông tin đã lưu -->
  <div id="savedCredentials">
    <p>👤 Username: <span id="savedUsername">-</span></p>
    <p>🔒 Password: ••••••••</p>
  </div>
  
  <!-- Warning nếu chưa có thông tin -->
  <div id="noCredentialsWarning">
    ⚠️ Chưa có thông tin! Hãy đăng ký trước.
  </div>
  
  <button id="loginBtn">🔐 Đăng Nhập Tự Động</button>
</div>
```

### Popup.js
```javascript
// Tab switching
document.getElementById('loginTab').addEventListener('click', () => {
  // Load saved credentials
  chrome.storage.local.get(['lastUsername', 'lastPassword'], (result) => {
    if (result.lastUsername && result.lastPassword) {
      // Show credentials
      // Enable button
    } else {
      // Show warning
      // Disable button
    }
  });
});

// Login button
document.getElementById('loginBtn').addEventListener('click', () => {
  chrome.storage.local.get(['lastUsername', 'lastPassword'], (result) => {
    const urls = getUrlsFromCheckboxes();
    
    chrome.runtime.sendMessage({
      action: 'startMultiLogin',
      data: { urls, username: result.lastUsername, password: result.lastPassword }
    });
  });
});
```

### Background.js
```javascript
// Handle login request
if (request.action === 'startMultiLogin') {
  handleMultiLogin(request.data);
}

async function handleMultiLogin(data) {
  const { urls, username, password } = data;
  
  // Create all tabs
  const tabs = await Promise.all(
    urls.map(url => chrome.tabs.create({ url, active: false }))
  );
  
  // Login each tab with retry
  await Promise.all(
    tabs.map(tab => 
      retryWithReload(tab.id, url, () => 
        waitAndAutoLogin(tab.id, username, password)
      )
    )
  );
}

async function waitAndAutoLogin(tabId, username, password) {
  // Wait for page load
  // Inject content script
  // Send autoLogin message
  chrome.tabs.sendMessage(tabId, {
    action: 'autoLogin',
    data: { username, password }
  });
}
```

### Content.js
```javascript
// Handle autoLogin message
if (request.action === 'autoLogin') {
  startAutoLogin(request.data, sendResponse);
}

function startAutoLogin(data, sendResponse) {
  // Find login inputs
  const inputs = findAllInputs();
  
  // Fill username & password
  fillLoginForm(inputs, data.username, data.password);
  
  // Auto submit
  autoSubmitLoginForm();
  
  sendResponse({ success: true });
}

function fillLoginForm(inputs, username, password) {
  // Find username input (usually first)
  const usernameInput = inputs[0];
  fillInput(usernameInput, username);
  
  // Find password input (usually second or type="password")
  const passwordInput = inputs.find(inp => inp.type === 'password') || inputs[1];
  fillInput(passwordInput, password);
  
  return { username: true, password: true };
}

function autoSubmitLoginForm() {
  // Find submit button
  const submitBtn = document.querySelector('button[type="submit"]') ||
                    document.querySelector('.login-btn') ||
                    document.querySelector('button');
  
  if (submitBtn) {
    submitBtn.click();
  }
}
```

## 🔄 Flow hoàn chỉnh

```
1. User đăng ký lần đầu
   ↓
2. Tool lưu username + password vào chrome.storage
   ↓
3. User mở tab "Đăng Nhập"
   ↓
4. Tool load thông tin từ storage
   ↓
5. Hiển thị username (password ẩn)
   ↓
6. User chọn trang và click "Đăng Nhập"
   ↓
7. Tool mở tất cả tab
   ↓
8. Mỗi tab:
   - Inject content script
   - Gửi message autoLogin với username + password
   - Content script tìm form và điền
   - Auto submit
   ↓
9. ✅ Đăng nhập thành công!
```

## 📊 Data flow

```
Register:
User Input → Popup → Background → Content → Website
                ↓
         chrome.storage.local
         (save username + password)

Login:
chrome.storage.local → Popup → Background → Content → Website
(load username + password)
```

## 🎯 Lợi ích

1. ✅ **Không cần nhập lại:** Tự động lấy từ lần đăng ký
2. ✅ **Đăng nhập nhiều trang:** Parallel mode
3. ✅ **Retry tự động:** Nếu trang load chậm
4. ✅ **Human-like:** Tránh bot detection
5. ✅ **Tiết kiệm thời gian:** Chỉ cần 1 click

## ⚠️ Lưu ý

1. **Phải đăng ký trước:** Nếu chưa đăng ký, button sẽ bị disable
2. **Thông tin lưu local:** Chỉ lưu trong Chrome, không gửi ra ngoài
3. **Cần cung cấp link:** Bạn cần cung cấp link đăng nhập cho từng trang
4. **Form phải tương tự:** Login form phải có cấu trúc tương tự register form

## 🔗 Link đăng nhập cần thêm

Hiện tại đã thêm placeholder cho các trang:
- 2899bb.com: `data-login-url="https://2899bb.com/home/login"`
- tv88vip.com: `data-login-url="https://tv88vip.com/home/login"`
- 888new10.com: `data-login-url="https://888new10.com/home/login"`
- 888vi8.com: `data-login-url="https://888vi8.com/home/login"`
- win678oo.com: `data-login-url="https://m.win678oo.com/home/login"`
- 888p28.com: `data-login-url="https://m.888p28.com/home/login"`

**Bạn cần cung cấp link chính xác để cập nhật!**

## 🧪 Test

1. Reload extension
2. Tab "Đăng Ký" → Đăng ký 1 tài khoản
3. Tab "Đăng Nhập" → Xem thông tin hiển thị
4. Chọn trang và click "Đăng Nhập Tự Động"
5. Xem console: Tool sẽ tự động điền và submit

## 🎊 Hoàn thành!

Tính năng đăng nhập tự động đã sẵn sàng! Chỉ cần cung cấp link đăng nhập chính xác.
