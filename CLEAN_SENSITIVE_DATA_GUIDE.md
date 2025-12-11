# 🧹 HƯỚNG DẪN XÓA DỮ LIỆU NHẠY CẢM

## ⚠️ Vấn Đề

Khi build package cho khách hàng, các thông tin nhạy cảm có thể bị copy theo:
- API Keys (Captcha, SIM, etc.)
- Tokens
- Screenshots
- License records
- Config cá nhân

## ✅ Giải Pháp

### Option 1: Tự Động (Khuyến Nghị)

Script `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat` đã được cập nhật để **TỰ ĐỘNG** clean sensitive data!

```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

Script sẽ tự động:
1. ✅ Xóa tất cả build scripts
2. ✅ Xóa screenshots folder
3. ✅ Xóa license-records
4. ✅ Xóa backups
5. ✅ Clear API keys trong config
6. ✅ Clear extensions config
7. ✅ Reset .env file
8. ✅ Xóa tất cả .md files

### Option 2: Manual Clean

Nếu đã build package và muốn clean sau:

```batch
CLEAN_PACKAGE.bat
```

Nhập tên package khi được hỏi (vd: `customer001`)

### Option 3: Script Trực Tiếp

```batch
node clean-sensitive-data.js customer-packages/customer001
```

---

## 🔍 Những Gì Được Clean

### 1. Config Files

**config/settings.json:**
```json
{
  "apiKey": {
    "key": "",        // ← Cleared
    "balance": 0      // ← Reset
  },
  "extensions": {
    "nohu-tool": ""   // ← Cleared
  }
}
```

### 2. Environment File

**.env:**
```
# Environment Configuration
# Khách hàng cần cấu hình các biến môi trường tại đây

# API Keys (nếu cần)
# CAPTCHA_API_KEY=
# SIM_API_KEY=
```

### 3. Folders Removed

- ❌ `screenshots/` - Screenshots của bạn
- ❌ `license-records/` - License records
- ❌ `backups/` - Backup files
- ❌ `customer-packages/` - Packages khác
- ❌ `.git/` - Git history

### 4. Files Removed

- ❌ `.license` - License file hiện tại
- ❌ `BUILD_*.bat` - Build scripts
- ❌ `*.md` - Documentation files
- ❌ `tools/generate-license.js` - License generator
- ❌ `tools/obfuscate-*.js` - Obfuscation tools

---

## ✅ Checklist Trước Khi Gửi

- [ ] Đã chạy `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat`
- [ ] Kiểm tra `config/settings.json` - API key = ""
- [ ] Kiểm tra `.env` - Không có keys
- [ ] Không có folder `screenshots/`
- [ ] Không có folder `license-records/`
- [ ] Không có file `.license`
- [ ] Không có build scripts (.bat)
- [ ] Không có documentation (.md)
- [ ] Code đã obfuscate
- [ ] LICENSE_KEY.txt có trong package
- [ ] README.txt có trong package

---

## 🎯 Workflow Đúng

```
1. Develop & Test
   ↓
2. BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
   ↓ (Tự động clean)
3. Kiểm tra package
   ↓
4. Nén thành ZIP
   ↓
5. Gửi cho khách hàng
```

---

## 🔐 Bảo Mật

### ✅ An Toàn Để Gửi:
- LICENSE_KEY.txt (đã mã hóa)
- README.txt
- Code đã obfuscate
- Config đã clean

### ❌ KHÔNG BAO GIỜ Gửi:
- API keys của bạn
- Screenshots của bạn
- License records
- Build scripts
- Obfuscation tools
- Git history

---

## 💡 Tips

### Kiểm Tra Nhanh

Sau khi build, check những file này:

```batch
# Check config
type customer-packages\customer001\config\settings.json

# Check .env
type customer-packages\customer001\.env

# Check không có screenshots
dir customer-packages\customer001\screenshots
```

Nếu thấy API keys hoặc screenshots → Chạy lại clean!

---

## 🆘 Troubleshooting

### Vẫn thấy API keys?

```batch
node clean-sensitive-data.js customer-packages/customer001
```

### Quên clean trước khi gửi?

1. Yêu cầu khách xóa package
2. Build lại với clean
3. Gửi package mới

### Muốn thêm files cần xóa?

Edit file `clean-sensitive-data.js` và thêm vào list.

---

**Luôn clean trước khi gửi cho khách hàng! 🔒**
