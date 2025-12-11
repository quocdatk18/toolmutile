# API Key Security - Mask/Unmask Feature 🔐

## Tính năng mới:

Thêm khả năng **ẩn/hiện API Key** trong sidebar để bảo mật.

## Trước:

```
┌─────────────────────────────────────┐
│ 🔑 API Key Manager                  │
├─────────────────────────────────────┤
│ [abc123xyz789...]                   │
│ [💾 Lưu] [💰 Kiểm Tra]             │
└─────────────────────────────────────┘
```
❌ API Key hiển thị rõ ràng  
❌ Ai nhìn qua cũng thấy  
❌ Không bảo mật  

## Sau:

```
┌─────────────────────────────────────┐
│ 🔑 API Key Manager                  │
├─────────────────────────────────────┤
│ [•••••••••••••••] [👁️]             │
│ [💾 Lưu] [💰 Kiểm Tra]             │
└─────────────────────────────────────┘
```
✅ API Key được mask (••••)  
✅ Click 👁️ để hiện/ẩn  
✅ Bảo mật tốt hơn  

## Features:

### 1. **Password Input Type**
- Input type mặc định: `password`
- Hiển thị dạng dots (••••)
- Letter-spacing: 3px cho dễ đọc khi unmask

### 2. **Toggle Button**
- Icon: 👁️ (show) / 🙈 (hide)
- Vị trí: Góc phải của input
- Size: 35x35px
- Hover effect: Scale 1.1x, background #f7fafc

### 3. **Font Style**
- Font-family: 'Courier New', monospace
- Dễ đọc các ký tự giống nhau (0/O, 1/l/I)

### 4. **Auto-mask on Load**
- Khi load API key từ localStorage → Tự động set type="password"
- Bảo mật ngay từ đầu

## Implementation:

### HTML Structure:
```html
<div class="input-with-toggle">
    <input type="password" id="globalApiKey" placeholder="...">
    <button class="btn-toggle-visibility" onclick="toggleApiKeyVisibility()">
        <span id="toggleIcon">👁️</span>
    </button>
</div>
```

### CSS Highlights:
```css
.api-key-panel input {
    padding-right: 45px; /* Space for button */
    font-family: 'Courier New', monospace;
}

.api-key-panel input[type="password"] {
    letter-spacing: 3px; /* Better dots spacing */
}

.btn-toggle-visibility {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
}
```

### JavaScript Logic:
```javascript
function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('globalApiKey');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleIcon.textContent = '🙈'; // Hide
    } else {
        apiKeyInput.type = 'password';
        toggleIcon.textContent = '👁️'; // Show
    }
}
```

## States:

### State 1: Masked (Default)
```
Input type: password
Display: •••••••••••••••
Icon: 👁️ (click to show)
```

### State 2: Unmasked
```
Input type: text
Display: abc123xyz789...
Icon: 🙈 (click to hide)
```

## Security Benefits:

### 1. **Screen Recording Protection** 🎥
- API key không hiển thị trong screen recordings
- An toàn khi share screen

### 2. **Shoulder Surfing Protection** 👀
- Người đứng sau không thấy API key
- Bảo vệ trong môi trường công cộng

### 3. **Screenshot Protection** 📸
- API key không lộ trong screenshots
- An toàn khi chia sẻ hình ảnh

### 4. **Accidental Exposure Prevention** 🛡️
- Giảm nguy cơ lộ key do sơ ý
- Phải chủ động click mới thấy

## UX Considerations:

### ✅ Good:
- Toggle button rõ ràng, dễ nhấn
- Icon trực quan (👁️ = show, 🙈 = hide)
- Hover effect feedback
- Monospace font dễ đọc
- Mặc định masked (secure by default)

### 🎯 Use Cases:

**Scenario 1: Nhập API Key lần đầu**
1. User nhập key (masked)
2. Click 👁️ để kiểm tra đã đúng chưa
3. Click 🙈 để mask lại
4. Click "Lưu"

**Scenario 2: Kiểm tra API Key đã lưu**
1. Load dashboard → Key đã masked
2. Click 👁️ để xem key
3. Copy key nếu cần
4. Click 🙈 để mask lại

**Scenario 3: Share screen**
1. Đang share screen
2. Key đã masked → An toàn
3. Không cần lo lộ key

## Files Modified:

1. **dashboard/index.html**:
   - Wrapped input in `.input-with-toggle`
   - Changed input type to `password`
   - Added toggle button

2. **dashboard/styles.css**:
   - Added `.input-with-toggle` styles
   - Added `.btn-toggle-visibility` styles
   - Added `input[type="password"]` letter-spacing

3. **dashboard/dashboard.js**:
   - Updated `loadApiKeyInfo()` to set type="password"
   - Added `toggleApiKeyVisibility()` function

## Testing:

1. ✅ Load dashboard → API key masked
2. ✅ Click 👁️ → Key visible, icon changes to 🙈
3. ✅ Click 🙈 → Key masked, icon changes to 👁️
4. ✅ Nhập key mới → Vẫn masked
5. ✅ Lưu key → Reload vẫn masked
6. ✅ Hover button → Scale animation
7. ✅ Monospace font → Dễ đọc

## Future Enhancements:

💡 **Auto-hide after X seconds**
- Tự động mask lại sau 30s không tương tác

💡 **Copy to clipboard**
- Nút copy key mà không cần unmask

💡 **Key strength indicator**
- Hiển thị độ mạnh của API key

💡 **Multiple API keys**
- Hỗ trợ nhiều API keys cho các services khác nhau
