# 📁 Cấu Trúc Thư Mục Theo Session

## 🐛 Vấn Đề Cũ
```
screenshots/
  ├── dat11111/
  │   ├── go99-2025-01-10T10-30-45.png  (lần 1)
  │   ├── nohu-2025-01-10T10-30-50.png  (lần 1)
  │   ├── go99-2025-01-10T14-20-30.png  (lần 2) ❌ Cộng dồn
  │   ├── nohu-2025-01-10T14-20-35.png  (lần 2) ❌ Cộng dồn
```

**Vấn đề**:
- ❌ Tất cả ảnh lưu chung 1 thư mục
- ❌ Chạy lại → ảnh bị cộng dồn
- ❌ Không phân biệt được lần chạy nào
- ❌ Hiển thị sai trong bảng kết quả

## ✅ Giải Pháp Mới

### Cấu Trúc Thư Mục:
```
screenshots/
  ├── dat11111/
  │   ├── 2025-01-10T10-30-45/  ← Session 1
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   │   ├── tt88.png
  │   ├── 2025-01-10T14-20-30/  ← Session 2
  │   │   ├── go99.png
  │   │   ├── nohu.png
  │   │   ├── tt88.png
  │   ├── 2025-01-11T09-15-20/  ← Session 3
  │   │   ├── go99.png
  │   │   ├── nohu.png
```

**Lợi ích**:
- ✅ Mỗi lần chạy = 1 thư mục riêng
- ✅ Không bị cộng dồn
- ✅ Dễ quản lý, dễ xóa
- ✅ Hiển thị đúng trong bảng kết quả

---

## 🔧 Implementation

### 1. Tạo Session ID (Backend)
```javascript
// dashboard/server.js
const sessionId = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .substring(0, 19); // YYYY-MM-DDTHH-MM-SS

config.sessionId = sessionId;
```

### 2. Lưu Screenshot Theo Session
```javascript
// tools/nohu-tool/complete-automation.js
const sessionId = this.settings.sessionId || 'default';

// Create folder structure
const userDir = path.join(screenshotsDir, username);
const sessionDir = path.join(userDir, sessionId);

// Save screenshot
const filename = `${siteName}.png`; // Simple name
const filepath = path.join(sessionDir, filename);
```

### 3. Scan Theo Session (API)
```javascript
// dashboard/server.js - /api/automation/results
userFolders.forEach(username => {
    const sessionFolders = fs.readdirSync(userDir)
        .filter(item => item.isDirectory());
    
    sessionFolders.forEach(sessionId => {
        const files = fs.readdirSync(sessionDir);
        
        files.forEach(file => {
            results.push({
                username,
                sessionId,
                screenshot: `/screenshots/${username}/${sessionId}/${file}`
            });
        });
    });
});
```

### 4. Group Theo Session (Frontend)
```javascript
// dashboard/tools-ui/nohu-tool.html
const key = `${username}_${sessionId}`;

resultsData[key] = {
    username,
    sessionId,
    sites: [],
    screenshots: []
};
```

---

## 📊 Hiển Thị Kết Quả

### Trước (Group theo username):
```
| dat11111 | 6 trang | 3 lần | ✅ 6 | 📷 |
```
→ Hiển thị tổng hợp tất cả các lần chạy

### Sau (Group theo username + sessionId):
```
| dat11111 | 3 trang | 1 lần | ✅ 3 | 📷 | 10:30:45 |  ← Lần 1
| dat11111 | 3 trang | 1 lần | ✅ 3 | 📷 | 14:20:30 |  ← Lần 2
| dat11111 | 3 trang | 1 lần | ✅ 3 | 📷 | 09:15:20 |  ← Lần 3
```
→ Mỗi lần chạy là 1 dòng riêng

---

## 🗑️ Xóa Kết Quả

### Xóa Từng Session:
```javascript
// Chọn checkbox của session muốn xóa
// Click "Xóa Đã Chọn"
// → Chỉ xóa session đó, giữ nguyên các session khác
```

### Xóa Tất Cả Sessions Của User:
```javascript
// Chọn tất cả checkbox của user
// Click "Xóa Đã Chọn"
// → Xóa tất cả sessions của user đó
```

### Xóa Toàn Bộ:
```javascript
// Click "Xóa Tất Cả"
// → Xóa tất cả users và sessions
```

---

## 🔄 Backward Compatibility

Code vẫn hỗ trợ cấu trúc cũ:

```javascript
// Check if old structure (files directly) or new structure (session folders)
const items = fs.readdirSync(userDir, { withFileTypes: true });
const sessionFolders = items.filter(item => item.isDirectory());

if (sessionFolders.length > 0) {
    // New structure: screenshots/username/sessionId/file.png
    // ...
} else {
    // Old structure: screenshots/username/file.png
    // ...
}
```

---

## 📝 Files Đã Sửa

### 1. **dashboard/server.js**
- Tạo `sessionId` khi start automation
- Thêm `sessionId` vào config
- Sửa `/api/automation/results` để scan theo session folders
- Hỗ trợ backward compatibility

### 2. **tools/nohu-tool/complete-automation.js**
- Lấy `sessionId` từ config
- Tạo session folder: `screenshots/username/sessionId/`
- Lưu screenshot với tên đơn giản: `sitename.png`
- Include `sessionId` trong result gửi về dashboard

### 3. **dashboard/tools-ui/nohu-tool.html**
- Group theo `username_sessionId` thay vì chỉ `username`
- Mỗi session hiển thị 1 dòng riêng
- Checkbox xóa theo session

---

## 🧪 Test Cases

### Test 1: Chạy Lần Đầu
```bash
# 1. Chạy automation cho user "test123"
# 2. Check thư mục:
screenshots/test123/2025-01-10T10-30-45/
  ├── go99.png
  ├── nohu.png
  ├── tt88.png

# 3. Check bảng kết quả:
| test123 | 3 trang | 1 lần | ✅ 3 | 📷 | 10:30:45 |
```

### Test 2: Chạy Lần 2 (Cùng User)
```bash
# 1. Chạy lại automation cho user "test123"
# 2. Check thư mục:
screenshots/test123/
  ├── 2025-01-10T10-30-45/  ← Lần 1 (giữ nguyên)
  ├── 2025-01-10T14-20-30/  ← Lần 2 (mới)

# 3. Check bảng kết quả:
| test123 | 3 trang | 1 lần | ✅ 3 | 📷 | 10:30:45 |  ← Lần 1
| test123 | 3 trang | 1 lần | ✅ 3 | 📷 | 14:20:30 |  ← Lần 2
```

### Test 3: Xóa Session Cụ Thể
```bash
# 1. Chọn checkbox của session lần 1
# 2. Click "Xóa Đã Chọn"
# 3. Check thư mục:
screenshots/test123/
  ├── 2025-01-10T14-20-30/  ← Chỉ còn lần 2

# 4. Check bảng kết quả:
| test123 | 3 trang | 1 lần | ✅ 3 | 📷 | 14:20:30 |  ← Chỉ còn lần 2
```

### Test 4: Backward Compatibility
```bash
# 1. Có thư mục cũ:
screenshots/test123/
  ├── go99-2025-01-10T10-30-45.png  (old structure)
  ├── nohu-2025-01-10T10-30-50.png  (old structure)

# 2. Load results
# → Vẫn hiển thị được (backward compatible)

# 3. Chạy automation mới
# → Tạo session folder mới
screenshots/test123/
  ├── go99-2025-01-10T10-30-45.png  (old)
  ├── nohu-2025-01-10T10-30-50.png  (old)
  ├── 2025-01-10T14-20-30/  (new)
```

---

## ✅ Kết Quả

### Trước:
- ❌ Ảnh cộng dồn vào 1 thư mục
- ❌ Không phân biệt được lần chạy
- ❌ Hiển thị sai trong bảng
- ❌ Khó quản lý, khó xóa

### Sau:
- ✅ Mỗi lần chạy = 1 thư mục riêng
- ✅ Phân biệt rõ ràng từng lần chạy
- ✅ Hiển thị đúng trong bảng (mỗi lần = 1 dòng)
- ✅ Dễ quản lý, dễ xóa từng session
- ✅ Backward compatible với cấu trúc cũ

---

## 💡 Lưu Ý

- Session ID format: `YYYY-MM-DDTHH-MM-SS` (19 ký tự)
- Filename đơn giản: `sitename.png` (không có timestamp)
- Mỗi session = 1 lần chạy automation
- Có thể chạy nhiều lần cho cùng 1 user
- Mỗi lần hiển thị riêng trong bảng kết quả
