# Hidemium Multi-Tool 🎛️

**Standalone automation platform** for managing multiple tools with Hidemium profiles.

---

## ✨ What's Included

- 🎯 **Multi-Tool Dashboard** - Web-based control panel
- 📋 **Profile Manager** - Create/manage Hidemium profiles
- 🔑 **API Key Manager** - Centralized API key storage
- 🤖 **NOHU Auto Tool** - 7 game sites automation
- 🎨 **Modern UI** - Beautiful, responsive interface

---

## 🚀 Quick Start

### 1️⃣ Install
```bash
# Run this first
INSTALL.bat
```

### 2️⃣ Start
```bash
# Start the dashboard
START_DASHBOARD.bat
```

### 3️⃣ Open
```
http://localhost:3000
```

---

## 📋 Requirements

- ✅ Node.js 16+ installed
- ✅ Hidemium browser running
- ✅ Hidemium Local API enabled (port 2222)

---

## 🎯 How to Use

### Setup API Key
1. Open sidebar "🔑 API Key Manager"
2. Enter your AutoCaptcha.pro API key
3. Click "💾 Lưu"
4. Click "💰 Kiểm Tra" to verify

### Create Profile
1. Click "➕ Tạo Profile" in header
2. Choose OS and browser
3. Add proxy (optional)
4. Click "Tạo Profile"

### Run Automation
1. Click "NOHU Auto Tool"
2. Select profile from carousel
3. Check sites to automate
4. Fill account info
5. Click "🚀 CHẠY TỰ ĐỘNG"

---

## 🔧 Troubleshooting

### ⚠️ Hidemium Offline
**Problem**: Dashboard shows "Hidemium Offline"

**Solution**:
1. Open Hidemium browser
2. Go to Settings → Local API
3. Enable Local API
4. Ensure port is 2222
5. Refresh dashboard

### ⚠️ Profiles Not Loading
**Problem**: "Click Tải Lại để xem profiles"

**Solution**:
1. Check Hidemium is running
2. Verify Local API is enabled
3. Click "🔄 Tải Lại" button
4. Check browser console for errors

### ⚠️ Automation Fails
**Problem**: Automation stops or errors

**Solution**:
1. Verify API key is valid
2. Check captcha balance
3. Ensure profile is started
4. Check site URLs are correct

---

## 📁 Folder Structure

```
hidemium-multi-tool/
├── config/              Configuration
├── core/                Core modules
├── dashboard/           Web UI
├── tools/               Automation tools
├── INSTALL.bat          Install script
├── START_DASHBOARD.bat  Start script
└── README.md            This file
```

---

## 🔒 Security

- 🔐 API keys are **masked** by default
- 💾 All data stored **locally** (no cloud)
- 🛡️ No sensitive data sent externally

---

## 🎯 Supported Sites

**NOHU Auto Tool** supports:
- Go99
- NOHU
- TT88
- MMOO
- 789P
- 33WIN
- 88VV

**Features**:
- ✅ Auto registration
- ✅ Auto login
- ✅ Auto add bank
- ✅ Auto check promotions
- ✅ Parallel execution

---

## 📞 Support

### Common Issues

**Port 3000 already in use**
```bash
# Change port in dashboard/server.js
const PORT = 3001; // Change this
```

**Node.js not found**
```bash
# Install Node.js from nodejs.org
# Version 16 or higher required
```

**npm not found**
```bash
# npm comes with Node.js
# Reinstall Node.js if missing
```

---

## 📚 More Documentation

- `TESTING_GUIDE.md` - Testing instructions
- `STANDALONE_ANALYSIS.md` - Architecture details
- `FINAL_SUMMARY.md` - Complete features

---

## ⚡ Tips

1. **Create multiple profiles** for different accounts
2. **Use proxy** for better anonymity
3. **Check balance** before running automation
4. **Start profiles** before automation
5. **Monitor console** for errors

---

## 🎉 Enjoy!

**Version**: 1.0.0  
**Status**: ✅ Ready to use

For updates and support, check documentation files.
