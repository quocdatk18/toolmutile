# 🔌 Port Configuration - Updated

## ✅ Current Setup

| Service | Port | URL |
|---------|------|-----|
| **Dashboard** | **3000** | **http://localhost:3000** |
| **Hidemium Local API** | **50325** | http://localhost:50325 |

## 🎯 Why This Configuration?

- **Dashboard port 3000:** Dễ nhớ, standard port
- **Hidemium port 50325:** Port mặc định của Hidemium Local API

## ⚙️ Setup Hidemium Local API

### Bước 1: Mở Hidemium Settings

1. Mở Hidemium Browser
2. Click vào Settings (⚙️)
3. Tìm "Local API" section

### Bước 2: Configure Port

1. Enable "Local API"
2. Set Port: **50325** (hoặc check port hiện tại)
3. Click "Save"
4. Restart Hidemium

### Bước 3: Verify

Test API:
```
http://localhost:50325/api/v1/profile/list
```

Nếu thấy JSON response → OK!

## 🚀 Start Dashboard

```bash
cd hidemium-multi-tool
npm run dashboard
```

Mở: **http://localhost:3000**

## 🏗️ Architecture

```
User Browser
    ↓
http://localhost:3000 (Dashboard)
    ↓
http://localhost:50325 (Hidemium API)
    ↓
Hidemium Browser
```

## 🔧 Troubleshooting

### Error: EADDRINUSE Port 3000

**Cause:** Có service khác đang dùng port 3000

**Solution:**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Error: Cannot connect to Hidemium

**Cause:** Hidemium Local API không chạy hoặc sai port

**Solution:**

1. Check Hidemium đang chạy
2. Check Local API enabled
3. Check port = 50325
4. Restart Hidemium
5. Test: http://localhost:50325/api/v1/profile/list

### Nếu Hidemium dùng port khác

Nếu Hidemium của bạn dùng port khác (ví dụ: 3001), update trong:

**`dashboard/server.js`:**
```javascript
// Thay tất cả localhost:50325 thành localhost:3001
```

**`core/hidemium-api.js`:**
```javascript
this.baseUrl = 'http://localhost:3001';
```

## 📝 Files Updated

- ✅ dashboard/server.js (port 3000, Hidemium API 50325)
- ✅ START_DASHBOARD.bat (port 3000)
- ✅ core/hidemium-api.js (Hidemium 50325)
- ✅ dashboard/dashboard.js (port 3000)
- ✅ config/settings.json (ports updated)
- ✅ dashboard/tools-ui/nohu-tool.html (port 3000)

## ✅ Ready to Use!

1. **Start Hidemium** (port 50325)
2. **Start Dashboard** (port 3000)
3. **Open Browser:** http://localhost:3000

---

**Note:** Nếu bạn thay đổi port, nhớ update tất cả các files trên!
