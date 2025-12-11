# Fix: Xóa Kết Quả Đã Chọn

## Vấn đề

Khi chọn 1 kết quả để xóa, tool lại xóa TẤT CẢ kết quả có cùng tên tài khoản (username).

**Ví dụ:**
- User có 3 sessions với username `vip999`:
  - Session 1: 2024-12-09T10-00-00
  - Session 2: 2024-12-09T11-00-00
  - Session 3: 2024-12-09T12-00-00
- Chọn xóa Session 1
- Kết quả: CẢ 3 sessions đều bị xóa ❌

## Nguyên nhân

### 1. Frontend (nohu-tool.html)
- Hàm `deleteSelectedResults()` chỉ gửi `username` lên server
- Không gửi `sessionId` để xác định session cụ thể

### 2. Backend (server.js)
- API `/api/results/clear-selected` nhận `usernames` array
- Xóa toàn bộ folder `screenshots/{username}/`
- Không phân biệt sessions

### 3. Data Structure
- `resultsData` không lưu `sessionId`
- Không thể xác định session nào cần xóa

## Giải pháp

### 1. Thêm sessionId vào resultsData

**File:** `dashboard/tools-ui/nohu-tool.html`

```javascript
// Trước:
resultsData[key] = {
    profileName: result.profileName,
    username: username,
    sites: [],
    // ...
};

// Sau:
resultsData[key] = {
    profileName: result.profileName,
    username: username,
    sessionId: sessionId, // ✅ Thêm sessionId
    sites: [],
    // ...
};
```

### 2. Gửi sessions thay vì usernames

**File:** `dashboard/tools-ui/nohu-tool.html`

```javascript
// Trước:
const selectedUsernames = selectedKeys.map(key => 
    resultsData[key]?.username
).filter(Boolean);

body: JSON.stringify({ usernames: selectedUsernames })

// Sau:
const sessionsToDelete = selectedKeys.map(key => {
    const data = resultsData[key];
    return {
        username: data?.username,
        sessionId: data?.sessionId || null
    };
}).filter(s => s.username);

body: JSON.stringify({ sessions: sessionsToDelete })
```

### 3. API xóa theo session

**File:** `dashboard/server.js`

```javascript
// Trước:
app.delete('/api/results/clear-selected', (req, res) => {
    const { usernames } = req.body;
    
    usernames.forEach(username => {
        const userDir = path.join(screenshotsDir, username);
        fs.rmSync(userDir, { recursive: true }); // ❌ Xóa toàn bộ
    });
});

// Sau:
app.delete('/api/results/clear-selected', (req, res) => {
    const { sessions } = req.body;
    
    sessions.forEach(session => {
        const { username, sessionId } = session;
        
        if (sessionId) {
            // ✅ Xóa session cụ thể
            const sessionDir = path.join(screenshotsDir, username, sessionId);
            fs.rmSync(sessionDir, { recursive: true });
        } else {
            // Old structure: xóa files trong user folder
            // (không có sessions)
        }
    });
});
```

### 4. Thêm sessionId vào status

**File:** `dashboard/server.js`

```javascript
// Gửi status khi automation bắt đầu
await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
    username: username,
    profileName: profileName,
    sessionId: config.sessionId, // ✅ Thêm sessionId
    status: 'running',
    sites: config.sites || [],
    timestamp: Date.now()
});
```

## Cấu trúc Session

### New Structure (có sessionId):
```
screenshots/
  vip999/
    2024-12-09T10-00-00/
      metadata.json
      Go99.png
      NOHU.png
    2024-12-09T11-00-00/
      metadata.json
      TT88.png
```

### Old Structure (không có sessionId):
```
screenshots/
  vip999/
    Go99-1234567890.png
    NOHU-1234567891.png
```

## Logic Xóa

### Xóa Session Cụ Thể (New Structure):
1. Nhận `{ username: "vip999", sessionId: "2024-12-09T10-00-00" }`
2. Xóa folder `screenshots/vip999/2024-12-09T10-00-00/`
3. Nếu folder `vip999` trống → xóa luôn folder user

### Xóa Files (Old Structure):
1. Nhận `{ username: "vip999", sessionId: null }`
2. Xóa tất cả `.png` files trong `screenshots/vip999/`
3. Nếu folder trống → xóa folder user

## Test Cases

### Test 1: Xóa 1 session cụ thể
**Setup:**
- User `vip999` có 3 sessions
- Chọn xóa session 1

**Kết quả mong đợi:**
- ✅ Chỉ session 1 bị xóa
- ✅ Session 2 và 3 vẫn còn

### Test 2: Xóa nhiều sessions khác nhau
**Setup:**
- User `vip999` có 3 sessions
- User `test123` có 2 sessions
- Chọn xóa: vip999-session1, test123-session1

**Kết quả mong đợi:**
- ✅ vip999-session1 bị xóa
- ✅ test123-session1 bị xóa
- ✅ Các sessions khác vẫn còn

### Test 3: Xóa tất cả sessions của 1 user
**Setup:**
- User `vip999` có 3 sessions
- Chọn xóa cả 3 sessions

**Kết quả mong đợi:**
- ✅ Cả 3 sessions bị xóa
- ✅ Folder `vip999` bị xóa (vì trống)

### Test 4: Xóa old structure (không có session)
**Setup:**
- User `olduser` có files trực tiếp (không có session folder)
- Chọn xóa

**Kết quả mong đợi:**
- ✅ Tất cả `.png` files bị xóa
- ✅ Folder `olduser` bị xóa nếu trống

## Files Đã Sửa

1. ✅ `dashboard/tools-ui/nohu-tool.html`
   - Thêm `sessionId` vào `resultsData`
   - Gửi `sessions` array thay vì `usernames`
   - Cập nhật key cho running status

2. ✅ `dashboard/server.js`
   - API `/api/results/clear-selected` nhận `sessions` array
   - Xóa theo session cụ thể
   - Thêm `sessionId` vào status update
   - Xử lý cả new structure (sessions) và old structure (files)

## Lưu ý

1. **Backward Compatible**: Vẫn hỗ trợ old structure (files không có session)
2. **Auto Cleanup**: Tự động xóa folder user nếu trống
3. **Safe Delete**: Chỉ xóa session được chọn, không ảnh hưởng sessions khác
4. **Metadata**: File `metadata.json` cũng bị xóa cùng session

## Kết luận

Sau khi fix:
- ✅ Xóa chính xác session được chọn
- ✅ Không ảnh hưởng sessions khác
- ✅ Hỗ trợ cả new và old structure
- ✅ Tự động cleanup folders trống
- ✅ Console log chi tiết để debug
