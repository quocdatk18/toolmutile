# Selective Obfuscation Strategy

## Vấn đề
- Obfuscate toàn bộ → package không chạy
- Không obfuscate → khách bypass license check

## Giải pháp
Obfuscate chỉ **critical files** (phần kiểm tra quyền):

### Files cần Obfuscate (Critical)
1. `core/license-manager.js` - Kiểm tra license
2. `dashboard/server.js` - Kiểm tra quyền tool (dòng 1493-1507, 2481-2495)
3. `.license` file - Không để khách sửa

### Files KHÔNG Obfuscate (Automation)
1. `tools/nohu-tool/auto-sequence.js` - Cần chạy
2. `tools/vip-tool/vip-automation.js` - Cần chạy
3. `tools/*/extension/*.js` - Cần chạy
4. `dashboard/dashboard.js` - UI logic

## Cách Implement

### Option 1: Obfuscate Selective (Recommended)
```bash
# Chỉ obfuscate critical files
javascript-obfuscator core/license-manager.js --output core/license-manager.js
javascript-obfuscator dashboard/server.js --output dashboard/server.js
```

### Option 2: Minify + Encrypt Key
```bash
# Minify critical files (nhẹ hơn obfuscate)
terser core/license-manager.js -o core/license-manager.js
terser dashboard/server.js -o dashboard/server.js

# Encrypt license key trong file
# Khách không thể sửa được
```

### Option 3: Server-Side Validation
```javascript
// Thêm validation ở server master
// Khi khách chạy, gọi API master để verify license
// Khách không thể bypass vì server master kiểm tra
```

## Khuyến nghị
**Dùng Option 3 (Server-Side Validation)** vì:
- Khách không thể bypass (server master kiểm tra)
- Không cần obfuscate (code vẫn an toàn)
- Dễ update license rules
- Dễ revoke license

## Implementation
1. Thêm endpoint `/api/verify-license` ở server master
2. Customer package gọi endpoint này khi chạy automation
3. Server master kiểm tra license + allowedTools
4. Nếu không hợp lệ → từ chối chạy
