# 🔧 FIX: ERR_CONNECTION_CLOSED

## ❌ Vấn đề

Tool bị dừng giữa chừng với lỗi:
```
Failed to load resource: net::ERR_CONNECTION_CLOSED
```

## 🔍 Nguyên nhân

1. **Chrome Service Worker tự động terminate** sau 30 giây không hoạt động
2. **Content script mất kết nối** với background khi nó restart
3. **Các promise bị reject** vì không nhận được response từ background

## ✅ Giải pháp đã áp dụng

### 1. Keep-Alive Mechanism (Giữ Service Worker sống)

```javascript
// Ping Chrome API mỗi 20 giây để giữ service worker không bị terminate
let keepAliveInterval = setInterval(() => {
  chrome.runtime.getPlatformInfo(() => {
    console.log('💓 Keep-alive ping');
  });
}, 20000);
```

**Lợi ích:**
- Service worker không bị Chrome terminate
- Connection giữa background và content script luôn ổn định

### 2. Better Error Handling (Xử lý lỗi tốt hơn)

**Trước:**
```javascript
// Chỉ retry 3 lần, không xử lý connection error
let retries = 3;
chrome.tabs.sendMessage(tabId, message, callback);
```

**Sau:**
```javascript
// Retry 5 lần + tự động re-inject script nếu connection lost
let retries = 5;

// Thêm timeout để tránh bị treo
const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

// Phát hiện connection error
if (error.includes('Could not establish connection') || 
    error.includes('Connection closed')) {
  
  // Tự động re-inject content script
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  });
}
```

**Lợi ích:**
- Tự động phục hồi khi connection bị đứt
- Không bị treo vô thời hạn
- Retry nhiều hơn để tăng tỷ lệ thành công

### 3. Tab Validation (Kiểm tra tab còn tồn tại)

```javascript
// Kiểm tra tab trước khi gửi message
const tabCheck = await chrome.tabs.get(tabId);
if (!tabCheck) {
  console.error('Tab không còn tồn tại');
  return false;
}
```

**Lợi ích:**
- Tránh gửi message đến tab đã bị đóng
- Giảm lỗi runtime

## 📊 Kết quả

- ✅ Service worker không bị terminate giữa chừng
- ✅ Tự động reconnect khi connection bị đứt
- ✅ Tool chạy ổn định hơn với nhiều tab
- ✅ Giảm lỗi `ERR_CONNECTION_CLOSED`

## 🧪 Test

1. Mở extension
2. Chọn nhiều trang (5-10 trang)
3. Chạy tool
4. Quan sát console - sẽ thấy:
   - `💓 Keep-alive ping` mỗi 20 giây
   - `🔄 Re-injecting content script...` nếu connection bị đứt
   - Tool tiếp tục chạy thay vì dừng

## 📝 Lưu ý

- Keep-alive sẽ tốn một chút tài nguyên (rất nhỏ)
- Nếu muốn tắt keep-alive, gọi `stopKeepAlive()`
- Timeout mặc định: 10 giây (có thể tăng nếu cần)
