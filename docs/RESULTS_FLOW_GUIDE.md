# 📊 Hướng Dẫn Flow Kết Quả Automation

## Tổng Quan

Kết quả automation được lưu vào thư mục `screenshots/` và gửi về dashboard qua API để hiển thị real-time.

## Flow Hoàn Chỉnh

```
┌─────────────────────────────────────────────────────────────┐
│  1. AUTOMATION CHẠY (Node.js)                               │
│     - Chụp màn hình                                         │
│     - Lưu vào screenshots/filename.png                      │
│     - POST kết quả về API                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. SERVER API (Express)                                    │
│     POST /api/automation/result                             │
│     - Nhận kết quả từ automation                            │
│     - Lưu vào global.automationResults                      │
│     - Serve ảnh qua /screenshots/                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. DASHBOARD UI (Browser)                                  │
│     GET /api/automation/results                             │
│     - Tự động load mỗi 5 giây                               │
│     - Gộp theo username                                     │
│     - Hiển thị trong bảng                                   │
│     - Click để xem modal ảnh                                │
└─────────────────────────────────────────────────────────────┘
```

## Chi Tiết Từng Bước

### 1. Automation Lưu Kết Quả

**File**: `tools/nohu-tool/complete-automation.js`

```javascript
// Chụp màn hình
const filename = `promo-${siteName}-${username}-${timestamp}.png`;
const filepath = path.join(screenshotsDir, filename);
await promoPage.screenshot({ path: filepath });

// Gửi về API
await axios.post('http://localhost:3000/api/automation/result', {
    profileName: 'Profile',
    username: username,
    siteName: siteName,
    timestamp: Date.now(),
    status: 'success',
    screenshot: `/screenshots/${filename}`,
    promotions: []
});
```

### 2. Server API Endpoints

**File**: `dashboard/server.js`

#### POST /api/automation/result
Nhận kết quả từ automation:
```javascript
{
    profileName: string,
    username: string,
    siteName: string,
    timestamp: number,
    status: 'success' | 'error' | 'running',
    screenshot: string,  // URL: /screenshots/filename.png
    promotions: array
}
```

#### GET /api/automation/results
Trả về tất cả kết quả:
```javascript
{
    success: true,
    results: [...]
}
```

### 3. Dashboard Load Kết Quả

**File**: `dashboard/tools-ui/nohu-tool.html`

```javascript
// Auto-refresh mỗi 5 giây
setInterval(() => {
    loadResultsFromServer();
}, 5000);

// Load và gộp theo username
async function loadResultsFromServer() {
    const response = await fetch('/api/automation/results');
    const data = await response.json();
    
    data.results.forEach(result => {
        addResultToTable(result); // Tự động gộp theo username
    });
}
```

## Cấu Trúc Dữ Liệu

### Result Object
```javascript
{
    profileName: "Profile 1",
    username: "user123",
    siteName: "go99code.store",
    timestamp: 1702012345678,
    status: "success",
    screenshot: "/screenshots/promo-go99code-store-user123-2024-12-08.png",
    promotions: [
        { name: "Khuyến mãi 1", amount: "100K" }
    ]
}
```

### Grouped Data (trong resultsData)
```javascript
{
    "Profile 1_user123": {
        profileName: "Profile 1",
        username: "user123",
        sites: [
            { name: "go99code.store", status: "success", screenshot: "...", timestamp: ... },
            { name: "nohucode.shop", status: "success", screenshot: "...", timestamp: ... }
        ],
        screenshots: [
            { site: "go99code.store", url: "/screenshots/...", timestamp: ... },
            { site: "nohucode.shop", url: "/screenshots/...", timestamp: ... }
        ],
        firstTimestamp: 1702012345678,
        lastTimestamp: 1702012456789
    }
}
```

## Thư Mục Screenshots

### Vị Trí
```
hidemium-multi-tool/
├── screenshots/
│   ├── promo-go99code-store-user123-2024-12-08T10-30-45.png
│   ├── promo-nohucode-shop-user123-2024-12-08T10-31-20.png
│   └── ...
```

### Naming Convention
```
promo-{siteName}-{username}-{timestamp}.png
```

Ví dụ:
- `promo-go99code-store-FireFury1-2025-12-08T11-00-09-706Z.png`
- `promo-nohucode-shop-user123-2024-12-08T10-30-45-123Z.png`

### Server Configuration
```javascript
// dashboard/server.js
app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));
```

URL truy cập: `http://localhost:3000/screenshots/filename.png`

## Lưu Trữ

### Server-Side (In-Memory)
```javascript
global.automationResults = [
    { profileName: "...", username: "...", ... },
    { profileName: "...", username: "...", ... }
]
```

**Lưu ý**: Dữ liệu mất khi restart server. Có thể lưu vào file/database sau.

### Client-Side (localStorage)
```javascript
localStorage.setItem('nohu_automation_results_grouped', JSON.stringify(resultsData));
```

Key: `nohu_automation_results_grouped`

## API Testing

### Test POST Result
```bash
curl -X POST http://localhost:3000/api/automation/result \
  -H "Content-Type: application/json" \
  -d '{
    "profileName": "Profile Test",
    "username": "testuser",
    "siteName": "go99code.store",
    "timestamp": 1702012345678,
    "status": "success",
    "screenshot": "/screenshots/test.png"
  }'
```

### Test GET Results
```bash
curl http://localhost:3000/api/automation/results
```

## Troubleshooting

### Ảnh Không Hiển Thị?
1. **Kiểm tra file tồn tại**: `ls screenshots/`
2. **Kiểm tra server serve**: Mở `http://localhost:3000/screenshots/filename.png`
3. **Kiểm tra đường dẫn**: Phải bắt đầu bằng `/screenshots/`

### Kết Quả Không Cập Nhật?
1. **Kiểm tra API**: Mở DevTools → Network → Xem request `/api/automation/results`
2. **Kiểm tra console**: Xem log `✅ Loaded X results from server`
3. **Kiểm tra interval**: Auto-refresh mỗi 5 giây

### Automation Không Gửi Kết Quả?
1. **Kiểm tra log**: Xem `✅ Result sent to dashboard` trong console
2. **Kiểm tra API endpoint**: Server phải chạy trên port 3000
3. **Kiểm tra axios**: Đảm bảo `axios` đã được install

## Tương Lai

### Cải Tiến Có Thể Làm
- [ ] Lưu kết quả vào database (SQLite/MongoDB)
- [ ] WebSocket để update real-time (không cần polling)
- [ ] Compress ảnh để tiết kiệm dung lượng
- [ ] Upload ảnh lên cloud (S3/Cloudinary)
- [ ] Export kết quả ra Excel/PDF
- [ ] Filter/Search trong bảng kết quả
- [ ] Thống kê tỷ lệ thành công

## Kết Luận

Flow hiện tại:
1. ✅ Automation chụp ảnh → Lưu vào `screenshots/`
2. ✅ Automation POST kết quả → Server API
3. ✅ Dashboard GET kết quả → Hiển thị real-time
4. ✅ Gộp theo username → Modal xem ảnh

Tất cả hoạt động tự động, không cần can thiệp thủ công!
