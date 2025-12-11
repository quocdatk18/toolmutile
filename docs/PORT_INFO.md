# 🔌 Port Configuration

## Port Usage

### Port 3000 - Hidemium Local API
- **Service:** Hidemium Browser Local API
- **Purpose:** Hidemium profile management
- **Must be:** Always running for dashboard to work

### Port 3001 - Dashboard Server
- **Service:** Multi-Tool Dashboard
- **Purpose:** Web interface for tools
- **Access:** http://localhost:3001

## Why Different Ports?

Hidemium Local API sử dụng port 3000 mặc định. Để tránh conflict, Dashboard sử dụng port 3001.

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser: http://localhost:3001         │
│  (Dashboard UI)                         │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  Dashboard Server (Port 3001)           │
│  - Serves UI                            │
│  - Handles API requests                 │
│  - Proxies to Hidemium API              │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  Hidemium Local API (Port 3000)         │
│  - Profile management                   │
│  - Browser automation                   │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Error: EADDRINUSE Port 3001

**Cause:** Dashboard server already running

**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or just close the previous dashboard window
```

### Error: Cannot connect to Hidemium

**Cause:** Hidemium Local API not running

**Solution:**
1. Open Hidemium Browser
2. Settings → Local API → Enable
3. Restart Hidemium
4. Refresh dashboard

## Configuration

Port có thể thay đổi trong:

### `dashboard/server.js`
```javascript
const PORT = 3001; // Change this
```

### `config/settings.json`
```json
{
  "dashboard": {
    "port": 3001
  }
}
```

## URLs

- **Dashboard:** http://localhost:3001
- **Hidemium API:** http://localhost:3000
- **API Balance Check:** http://localhost:3001/api/captcha/balance
- **Profiles API:** http://localhost:3001/api/profiles/all

---

**Note:** Luôn đảm bảo Hidemium đang chạy trước khi start dashboard!
