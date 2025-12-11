# 🔧 Fix Lỗi "process is not defined"

## 🐛 Lỗi
```
Lỗi: process is not defined
```
Xuất hiện khi load profiles hoặc gọi API từ browser.

## 🔍 Nguyên Nhân
Sau khi sửa port động, code **client-side** (browser) đang cố dùng:
```javascript
process.env.DASHBOARD_PORT  // ❌ Chỉ có trong Node.js
global.DASHBOARD_PORT       // ❌ Chỉ có trong Node.js
```

**Vấn đề**: `process` và `global` chỉ tồn tại trong Node.js server-side, không có trong browser!

## ✅ Giải Pháp Đã Áp Dụng

### 1. Server-Side (Node.js)
Dùng `global.DASHBOARD_PORT`:
```javascript
// dashboard/server.js
const dashboardPort = global.DASHBOARD_PORT || 3000;
```

### 2. Client-Side (Browser)
Dùng **relative URLs** thay vì absolute URLs:

**Trước (❌ Lỗi)**:
```javascript
const dashboardPort = process.env.DASHBOARD_PORT || 3000;
const response = await fetch(`http://localhost:${dashboardPort}/api/profiles/all`);
```

**Sau (✅ Đúng)**:
```javascript
// Relative URL tự động dùng port của trang hiện tại
const response = await fetch('/api/profiles/all');
```

### 2. Di Chuyển Khai Báo
Di chuyển khai báo `dashboardPort` và `username` lên đầu hàm:
```javascript
async function runNohuAutomationInBackground(autoSequence, profileId, config) {
    const axios = require('axios');
    const dashboardPort = global.DASHBOARD_PORT || 3000;
    const username = config.username || 'Unknown';
    
    try {
        // ... code ...
    }
}
```

## 🔄 Cách Test Lại

### Bước 1: Restart Server
```bash
# Stop server (Ctrl+C)
# Start lại
npm run dashboard
```

### Bước 2: Clear Browser Cache
```
1. Mở DevTools (F12)
2. Right-click vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"
```

### Bước 3: Test Automation
```
1. Chọn profile
2. Điền thông tin
3. Click "Chạy Automation"
4. Kiểm tra console log
```

## 📊 Kiểm Tra Log

### Server Console (Terminal):
```
✅ Server running at: http://localhost:3000
🚀 Starting NOHU automation...
📂 Opening profile: xxx
✅ Connected to browser
📤 Sent "start" status to dashboard
```

### Browser Console (F12):
```
✅ Loaded X results from screenshots folder
📊 Automation request: {...}
```

## ❌ Nếu Vẫn Lỗi

### Check 1: Server có chạy không?
```bash
# Terminal should show:
✅ Server running at: http://localhost:XXXX
```

### Check 2: Port có đúng không?
```javascript
// In browser console:
console.log(window.location.port);
// Should match server port
```

### Check 3: File có được load không?
```
1. Mở DevTools → Network tab
2. Refresh page
3. Check xem server.js có được load không
```

## 🔧 Fallback Solution

Nếu vẫn không work, revert về hardcode port 3000:

```javascript
// dashboard/server.js
async function runNohuAutomationInBackground(autoSequence, profileId, config) {
    const axios = require('axios');
    const dashboardPort = 3000; // Hardcode
    const username = config.username || 'Unknown';
    
    // ... rest of code ...
}
```

## ✅ Kết Quả Mong Đợi

Sau khi fix:
- ✅ Không còn lỗi "process is not defined"
- ✅ Automation chạy bình thường
- ✅ Status "Đang chạy..." hiển thị ngay
- ✅ Tự động cập nhật khi hoàn thành

## 📝 Files Đã Sửa

### Server-Side (1 file):
1. **dashboard/server.js**
   - Dùng `global.DASHBOARD_PORT` thay vì `process.env.DASHBOARD_PORT`

### Client-Side (4 files):
2. **core/hidemium-api.js**
   - Dùng `window.location.port` thay vì `process.env`
   
3. **core/profile-manager.js**
   - Dùng relative URLs (`/api/...`) thay vì absolute URLs
   - Sửa: `loadAll()`, `create()`, `start()`, `stop()`, `delete()`

4. **core/api-key-manager.js**
   - Dùng relative URLs
   - Sửa: `checkBalance()`

5. **core/sim-api-manager.js**
   - Dùng relative URLs
   - Sửa: `checkBalance()`, `getPhoneNumber()`, `getOTP()`, `cancelSim()`

## 💡 Lưu Ý
- `global.DASHBOARD_PORT` được set khi server start
- Không cần dùng `process.env.DASHBOARD_PORT`
- Luôn restart server sau khi sửa code backend
