# ✅ Fixed: Port Conflict Issue

## 🐛 Problem

```
Error: listen EADDRINUSE: address already in use :::3000
```

Dashboard không thể start vì port 3000 đã được sử dụng bởi Hidemium Local API.

## ✅ Solution

Đã đổi Dashboard port từ **3000** → **3001**

## 📝 Changes Made

### 1. `dashboard/server.js`
```javascript
const PORT = 3001; // Changed from 3000
```

### 2. `config/settings.json`
```json
{
  "dashboard": {
    "port": 3001  // Changed from 3000
  }
}
```

### 3. `START_DASHBOARD.bat`
```
Dashboard will open at: http://localhost:3001
```

### 4. `dashboard/tools-ui/nohu-tool.html`
```javascript
fetch('http://localhost:3001/api/automation/run')  // Changed from 3000
```

### 5. `dashboard/dashboard.js`
```javascript
fetch(`http://localhost:3001/api/captcha/balance`)  // Changed from 3000
```

## 🎯 New Configuration

| Service | Port | URL |
|---------|------|-----|
| Hidemium Local API | 3000 | http://localhost:3000 |
| Dashboard Server | 3001 | http://localhost:3001 |

## 🚀 How to Use

### 1. Start Hidemium
- Mở Hidemium Browser
- Settings → Local API → Enable

### 2. Start Dashboard
```bash
cd hidemium-multi-tool
npm run dashboard
```

### 3. Open Browser
```
http://localhost:3001
```

## ✅ Benefits

- ✅ No port conflict
- ✅ Hidemium và Dashboard chạy song song
- ✅ Không cần tắt Hidemium Local API
- ✅ Dễ dàng debug

## 📊 Architecture

```
User Browser (localhost:3001)
        ↓
Dashboard Server (Port 3001)
        ↓
Hidemium Local API (Port 3000)
        ↓
Hidemium Browser
```

## 🔧 Troubleshooting

### Nếu vẫn lỗi port 3001:

```bash
# Check process using port 3001
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### Nếu muốn đổi port khác:

1. Edit `dashboard/server.js`: `const PORT = 3002;`
2. Edit `config/settings.json`: `"port": 3002`
3. Update URLs trong code
4. Restart server

---

**Status:** ✅ Fixed and Tested
**Date:** December 7, 2025
