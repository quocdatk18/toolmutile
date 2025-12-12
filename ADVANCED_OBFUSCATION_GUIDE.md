# 🔒 Advanced Obfuscation System - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan
Advanced Obfuscation System là hệ thống bảo vệ code toàn diện, obfuscate toàn bộ JavaScript với các mức độ bảo mật khác nhau và whitelist cho files cần thiết.

## ✅ Tính Năng Chính

### 🔐 Multi-Level Security
- **HIGH Security**: Cho files quan trọng (license, API, automation)
- **MEDIUM Security**: Cho files thông thường
- **Whitelist Protection**: Bảo vệ files cần thiết không bị obfuscate

### 🎯 Smart Detection
- Tự động phát hiện files quan trọng
- Áp dụng mức bảo mật phù hợp
- Bỏ qua files trong whitelist

### 📁 Complete Project Obfuscation
- Obfuscate toàn bộ project
- Giữ nguyên cấu trúc thư mục
- Copy non-JS files tự động

## 🚀 Cách Sử Dụng

### 1. **Obfuscate Toàn Bộ Project**
```bash
# Chạy batch file
ADVANCED_OBFUSCATE.bat

# Hoặc chạy trực tiếp
node tools/advanced-obfuscate.js
```

**Kết quả**: Tạo folder `obfuscated-project` với toàn bộ code đã được obfuscate

### 2. **Obfuscate Chỉ Files Quan Trọng**
```bash
# Chạy batch file
OBFUSCATE_CRITICAL_ONLY.bat

# Hoặc chạy trực tiếp
node tools/advanced-obfuscate.js --files "core/*.js" "tools/**/*.js"
```

**Kết quả**: Tạo files `*.obfuscated.js` cho từng file quan trọng

### 3. **Build Customer Package với Advanced Obfuscation**
```bash
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

**Kết quả**: Package khách hàng với code đã được obfuscate toàn diện

## 📋 Whitelist (Files Không Bị Obfuscate)

### 🔧 Build & Config Files
- `package.json`, `package-lock.json`
- `*.bat` files (BUILD, CREATE, INSTALL, etc.)
- `config/*.json`
- `.env`, `.gitignore`

### 📝 Documentation & Utilities
- `*.md` files (documentation)
- `*.txt` files
- `*.css`, `*.html` files
- Build scripts (`build-test-*.js`, `create-test-*.js`)

### 🛠️ Development Tools
- `generate-license*.js`
- `test-license*.js`
- `tools/obfuscate-*.js`
- `tools/advanced-obfuscate.js`

### 📁 Directories
- `node_modules/`
- `customer-packages/`
- `screenshots/`
- `.git/`

## 🔐 Security Levels

### HIGH Security (Critical Files)
```javascript
// Files được áp dụng HIGH security:
- core/license-manager.js
- core/api-key-manager.js
- core/hidemium-api.js
- core/profile-manager.js
- core/sim-api-manager.js
- dashboard/server.js
- tools/*/auto-sequence.js
- tools/*/complete-automation.js
- tools/*/automation*.js
- tools/*/freelxb*.js
```

**Features**:
- Control Flow Flattening: 100%
- Dead Code Injection: 60%
- Debug Protection: Enabled
- String Array Encoding: Base64 + RC4
- Self Defending: Enabled
- Identifier Mangling: Aggressive

### MEDIUM Security (Regular Files)
```javascript
// Tất cả files JavaScript khác
```

**Features**:
- Control Flow Flattening: 50%
- Dead Code Injection: 30%
- Debug Protection: Disabled
- String Array Encoding: Base64
- Self Defending: Enabled
- Identifier Mangling: Standard

## 📊 Obfuscation Options

### HIGH Security Options
```javascript
{
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1.0,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.6,
    debugProtection: true,
    debugProtectionInterval: 2000,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'mangled-shuffled',
    numbersToExpressions: true,
    renameGlobals: true,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64', 'rc4'],
    stringArrayThreshold: 1.0,
    transformObjectKeys: true
}
```

### MEDIUM Security Options
```javascript
{
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.3,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.7,
    transformObjectKeys: true
}
```

## 🎯 Use Cases

### 1. **Development Phase**
- Sử dụng `OBFUSCATE_CRITICAL_ONLY.bat`
- Chỉ obfuscate files quan trọng
- Giữ nguyên files khác để debug

### 2. **Testing Phase**
- Sử dụng `ADVANCED_OBFUSCATE.bat`
- Test toàn bộ project đã obfuscate
- Đảm bảo functionality không bị ảnh hưởng

### 3. **Production Release**
- Sử dụng `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat`
- Tạo package khách hàng hoàn chỉnh
- Code được bảo vệ tối đa

## ⚠️ Lưu Ý Quan Trọng

### 🔍 Testing
- **Luôn test** project sau khi obfuscate
- Một số features có thể bị ảnh hưởng
- Kiểm tra tất cả chức năng chính

### 💾 Backup
- **Backup code gốc** trước khi obfuscate
- Không overwrite files gốc
- Sử dụng version control (Git)

### 🚀 Performance
- Obfuscated code có thể chậm hơn 10-20%
- File size có thể tăng 50-100%
- Startup time có thể tăng

### 🛠️ Debugging
- Obfuscated code rất khó debug
- Sử dụng original code cho development
- Chỉ obfuscate cho production

## 📈 Security Benefits

### 🔒 Code Protection
- **Reverse Engineering**: Cực kỳ khó khăn
- **License Bypass**: Gần như không thể
- **API Key Extraction**: Được bảo vệ tốt
- **Logic Understanding**: Rất khó hiểu

### 🛡️ Anti-Tampering
- **Self Defending**: Tự bảo vệ khỏi modification
- **Debug Protection**: Chống debug tools
- **Control Flow**: Logic bị xáo trộn
- **String Encryption**: Strings được mã hóa

## 🎉 Kết Luận

Advanced Obfuscation System cung cấp:
- ✅ **Bảo mật toàn diện** cho toàn bộ project
- ✅ **Multi-level security** phù hợp từng loại file
- ✅ **Whitelist protection** cho files cần thiết
- ✅ **Easy-to-use** với batch files
- ✅ **Production-ready** cho customer packages

Hệ thống này đảm bảo code của bạn được bảo vệ tối đa khỏi reverse engineering và tampering!