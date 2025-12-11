# ✅ Fixed: Hidemium API Connection

## 🐛 Problem

- Dashboard báo "Hidemium Offline"
- API captcha bị lỗi
- Không load được profiles

## 🔍 Root Cause

Sử dụng sai URL và port cho Hidemium API:
- ❌ Sai: `http://localhost:50325/api/v1/profile/list`
- ✅ Đúng: `http://127.0.0.1:2222/profiles`

## ✅ Solution

### 1. Hidemium API URL

**Đúng:** `http://127.0.0.1:2222`

### 2. API Endpoints

| Action | Old (Wrong) | New (Correct) |
|--------|-------------|---------------|
| Get Profiles | `/api/v1/profile/list` | `/profiles` |
| Create Profile | `/api/v1/profile/create` | `/profiles` (POST) |
| Start Profile | `/api/v1/profile/start/:id` | `/profiles/:id/start` |
| Stop Profile | `/api/v1/profile/stop/:id` | `/profiles/:id/stop` |
| Delete Profile | `/api/v1/profile/delete/:id` | `/profiles/:id` (DELETE) |

### 3. Captcha API URL

**Đúng:** `https://autocaptcha.pro/apiv3/balance?key=YOUR_KEY`

## 📝 Files Updated

1. ✅ `dashboard/server.js` - All Hidemium API calls
2. ✅ `config/settings.json` - API URL
3. ✅ `core/hidemium-api.js` - Base URL

## 🚀 How to Use

### 1. Start Hidemium

Hidemium sẽ tự động chạy Local API trên `http://127.0.0.1:2222`

### 2. Verify Hidemium API

Test trong browser:
```
http://127.0.0.1:2222/profiles
```

Nếu thấy JSON response → OK!

### 3. Start Dashboard

```bash
cd hidemium-multi-tool
npm run dashboard
```

### 4. Open Dashboard

```
http://localhost:3000
```

## ✅ Expected Results

- ✅ Status badge: "Hidemium Connected" (màu xanh)
- ✅ API Key check hoạt động
- ✅ Load profiles thành công
- ✅ Create/Start/Stop profiles hoạt động

## 🔧 Troubleshooting

### Still showing "Hidemium Offline"?

1. **Check Hidemium đang chạy:**
   - Mở Hidemium Browser
   - Không cần enable gì cả, Local API tự động chạy

2. **Test API trực tiếp:**
   ```
   http://127.0.0.1:2222/profiles
   ```
   
3. **Check port 2222:**
   ```bash
   netstat -ano | findstr :2222
   ```

### API Captcha still error?

1. **Check API Key đúng format**
2. **Test trực tiếp:**
   ```
   https://autocaptcha.pro/apiv3/balance?key=YOUR_KEY
   ```
3. **Check có số dư không**

## 📊 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Dashboard | 3000 | http://localhost:3000 |
| Hidemium API | 2222 | http://127.0.0.1:2222 |

## ✅ Status

**Fixed and Tested!** 🎉

---

**Date:** December 7, 2025
