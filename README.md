# 🚀 Hidemium Multi-Tool - Production Ready

Multi-Tool Dashboard for Hidemium Browser Automation with License System & Code Protection.

---

## 🎯 BẮT ĐẦU NHANH

### Lần Đầu Tiên? Đọc Ngay:
👉 **[START_HERE.md](START_HERE.md)** ← Bắt đầu từ đây!

### Muốn Build Package Ngay?
```batch
npm install
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

### Xem Tất Cả Tài Liệu:
👉 **[INDEX.md](INDEX.md)** - Index đầy đủ

---

## ⚡ Quick Start (Cho Người Bán Tool)

### 1. Cài đặt
```batch
npm install
```

### 2. Build Package cho Khách hàng (Đã obfuscate)
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

### 3. Gửi Package
Nén folder `customer-packages/[customer-name]/` và gửi cho khách hàng.

📖 **Chi tiết:** [QUICK_START_OBFUSCATE.md](QUICK_START_OBFUSCATE.md)

---

## 🔒 Bảo vệ Code (Obfuscation)

Tool này có hệ thống obfuscate code để bảo vệ logic kinh doanh:

### Scripts có sẵn:

| Script | Mô tả |
|--------|-------|
| `OBFUSCATE_CODE.bat` | Obfuscate chỉ license manager |
| `OBFUSCATE_ALL_CODE.bat` | Obfuscate tất cả files quan trọng |
| `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat` | Build package hoàn chỉnh (tự động obfuscate) |
| `TEST_OBFUSCATED.bat` | Test code đã obfuscate |

### Files được bảo vệ:
- ✅ `core/license-manager.js` - Hệ thống license
- ✅ `core/api-key-manager.js` - Quản lý API keys
- ✅ `core/hidemium-api.js` - Hidemium API
- ✅ `core/profile-manager.js` - Profile manager
- ✅ `core/sim-api-manager.js` - SIM API manager
- ✅ `dashboard/server.js` - Backend server

📖 **Hướng dẫn chi tiết:** [docs/HUONG_DAN_OBFUSCATE.md](docs/HUONG_DAN_OBFUSCATE.md)

---

## 📦 Cấu trúc Project

```
hidemium-multi-tool/
├── core/                    # Core modules (sẽ được obfuscate)
│   ├── license-manager.js   # License system
│   ├── api-key-manager.js   # API key management
│   ├── hidemium-api.js      # Hidemium integration
│   ├── profile-manager.js   # Profile management
│   └── sim-api-manager.js   # SIM API integration
├── dashboard/               # Web dashboard
│   ├── server.js           # Express server (sẽ được obfuscate)
│   ├── dashboard.js        # Frontend logic
│   └── index.html          # Main UI
├── tools/                   # Build & utility tools
│   ├── generate-license.js # License generator
│   ├── obfuscate-license.js # Obfuscate single file
│   └── obfuscate-all.js    # Obfuscate all files
├── config/                  # Configuration files
├── docs/                    # Documentation
└── customer-packages/       # Generated customer packages
```

---

## 🎯 Features

### ✅ License System
- Trial, Monthly, Quarterly, Lifetime licenses
- Machine binding (optional)
- Automatic expiration checking
- Secure encryption with unique secret keys

### ✅ Code Protection
- JavaScript obfuscation
- Unique secret key per customer
- Cannot be cracked or modified
- Automatic backup system

### ✅ Multi-Tool Dashboard
- Hidemium browser automation
- Profile management
- API key management
- Results tracking
- Screenshot capture

---

## 🛠️ Development

### Chạy Dashboard (Development)
```batch
npm run dashboard
```

### Test License System
```batch
node tools/generate-license.js --days 7 --username test_user
node tools/activate-license.js
```

### Build Distribution
```batch
CREATE_DISTRIBUTION.bat
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START_OBFUSCATE.md](QUICK_START_OBFUSCATE.md) | Quick start guide |
| [docs/HUONG_DAN_OBFUSCATE.md](docs/HUONG_DAN_OBFUSCATE.md) | Hướng dẫn obfuscate chi tiết |
| [docs/CUSTOMER_PACKAGE_GUIDE.md](docs/CUSTOMER_PACKAGE_GUIDE.md) | Customer package guide |
| [docs/LICENSE_SYSTEM.md](docs/LICENSE_SYSTEM.md) | License system documentation |
| [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) | Testing guide |

---

## 🔐 Security Features

1. **Code Obfuscation**
   - All critical files are obfuscated
   - Cannot be read or modified by customers
   - Automatic obfuscation in build process

2. **License Protection**
   - Unique secret key per customer
   - Encrypted license keys
   - Machine binding option
   - Expiration checking

3. **API Security**
   - Encrypted API keys
   - Secure storage
   - No plain text credentials

---

## 📋 Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- Windows OS (for batch scripts)

---

## 🚀 Production Workflow

1. **Develop** - Work with original code
2. **Test** - Test all features
3. **Obfuscate** - Run `OBFUSCATE_ALL_CODE.bat`
4. **Build** - Run `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat`
5. **Test Package** - Test the customer package
6. **Deliver** - Send ZIP to customer

---

## ⚠️ Important Notes

- **NEVER commit obfuscated files** to Git
- **ALWAYS backup** before obfuscating (automatic)
- **TEST package** before sending to customer
- **SAVE secret keys** for each customer
- **Keep original code** safe in repository

---

## 🆘 Support

### Common Issues

**Obfuscation fails:**
```batch
npm install javascript-obfuscator
```

**Code doesn't work after obfuscate:**
- Restore from `backups/` folder
- Check original code for errors
- Test step by step

**License activation fails:**
- Check secret key matches
- Verify license not expired
- Check machine binding

---

## 📝 License

This tool is for commercial use. Each customer package includes its own license key.

---

## 🎉 Ready to Sell!

Your tool is now protected and ready for commercial distribution:

✅ Code obfuscated and protected  
✅ License system integrated  
✅ Unique secret key per customer  
✅ Automatic package builder  
✅ Professional documentation  

**Start building customer packages now:**
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

---

Made with ❤️ for secure tool distribution
