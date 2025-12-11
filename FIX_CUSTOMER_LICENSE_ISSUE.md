# Fix: Customer Package License Issue

## 🐛 Vấn Đề
Khi build package cho khách hàng, dù đã gắn license key rồi nhưng khi chạy vẫn thông báo "License required"

## 🔍 Nguyên Nhân
1. **Admin version detection sai**: Customer package vẫn có `admin.html` nên được coi là admin version
2. **Thiếu customer marker**: Không có cách phân biệt customer vs admin version
3. **Secret key không khớp**: License key tạo với secret gốc, nhưng customer có secret khác
4. **Không copy file .license**: Build process không copy file license (nếu có)

## ✅ Giải Pháp

### 1. Thêm Customer Version Marker
```javascript
// Trong buildPackage() - admin-api.js
// Create customer version marker
fs.writeFileSync(path.join(packagePath, '.customer'), customerName, 'utf8');
```

### 2. Sửa Admin Version Detection
```javascript
// Trong license-manager.js
isAdminVersion() {
    // Check if this is customer version first
    const customerFile = path.join(__dirname, '..', '.customer');
    if (fs.existsSync(customerFile)) {
        return false; // This is customer version
    }
    
    // Check if admin.html exists (master version has admin panel)
    const adminFile = path.join(__dirname, '..', 'dashboard', 'admin.html');
    return fs.existsSync(adminFile);
}
```

### 3. Sửa Build Process
```javascript
// Copy .license file (nếu có)
const itemsToCopy = ['core', 'dashboard', 'config', 'tools', 'package.json', 'package-lock.json', '.env', '.license'];

// Không xóa .license trong cleanSensitiveData
const filesToRemove = [
    // ... other files
    // '.license' - KEEP this file for customer license
    'dashboard/admin.html',      // ← Remove admin page
    'dashboard/admin-api.js'     // ← Remove admin API
];
```

### 4. Quy Trình Tạo License Key Đúng
```bash
# 1. Build customer package
node -e "const api = require('./dashboard/admin-api.js'); api.buildPackage({customerName: 'CUSTOMER_NAME', licenseType: 30, machineBinding: true}).then(console.log)"

# 2. Customer gửi Machine ID
# 3. Tạo license key với secret key của customer
cd customer-packages/CUSTOMER_NAME
node -e "const LM = require('./core/license-manager'); const lm = new LM(); const key = lm.generateKey({expiryDays: 30, machineId: 'MACHINE_ID', username: 'CUSTOMER_NAME'}); console.log('License Key:', key);"

# 4. Customer activate license
node -e "const LM = require('./core/license-manager'); const lm = new LM(); const result = lm.activate('LICENSE_KEY'); console.log(result);"
```

## 🎯 Kết Quả

### Admin Version (Development)
- ✅ `isAdminVersion()` = true
- ✅ Không cần license
- ✅ Có admin panel

### Customer Version (Production)
- ✅ `isAdminVersion()` = false (có file `.customer`)
- ✅ Cần license để hoạt động
- ✅ Không có admin panel
- ✅ License key hoạt động đúng với secret key riêng

## 📝 Test Results

### Before Fix:
```
Is Admin Version: true
Valid: true (bypass license)
Message: Master version - No license required
```

### After Fix:
```
Is Admin Version: false
Valid: true (after activation)
Message: Bản quyền hợp lệ
Has License File (.license): true
```

## 🔧 Tools Created
- `test-license-customer.js` - Test script để kiểm tra license validation
- `generate-customer-license.js` - Script tạo license key cho customer

## 📋 Checklist Khi Build Package
1. ✅ Build package với `buildPackage()`
2. ✅ Kiểm tra file `.customer` được tạo
3. ✅ Kiểm tra `admin.html` bị xóa
4. ✅ Customer gửi Machine ID
5. ✅ Tạo license key với secret key của customer
6. ✅ Customer activate license
7. ✅ Test hoạt động