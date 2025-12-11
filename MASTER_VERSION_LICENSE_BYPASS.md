# 👑 Master Version - License Bypass

## ✅ Đã Hoàn Thành

Tool master (có admin panel) giờ đây **không cần license key** và tự động bypass license check.

---

## 🎯 Logic

### Phát Hiện Master Version:
```javascript
isAdminVersion() {
    // Check if admin.html exists
    const adminFile = path.join(__dirname, '..', 'dashboard', 'admin.html');
    return fs.existsSync(adminFile);
}
```

**Cách hoạt động:**
- Nếu có file `dashboard/admin.html` → Master version
- Nếu không có → Customer version (cần license)

---

## 📋 Những Thay Đổi

### 1. **core/license-manager.js**

**Thêm function `isAdminVersion()`:**
- Check xem có file `admin.html` không
- Return `true` nếu là master version

**Cập nhật `checkLicense()`:**
```javascript
checkLicense() {
    // Bypass license check for admin/master version
    if (this.isAdminVersion()) {
        return {
            valid: true,
            message: 'Master version - No license required',
            isMaster: true,
            data: {
                username: 'Master',
                isLifetime: true,
                created: Date.now(),
                expiry: -1,
                remainingDays: -1,
                machineId: this.getMachineId()
            }
        };
    }
    
    // Normal license check for customer version
    // ...
}
```

### 2. **dashboard/server.js**

**Cập nhật `/api/license/info` endpoint:**
```javascript
app.get('/api/license/info', (req, res) => {
    const checkResult = licenseManager.checkLicense();
    const info = licenseManager.getLicenseInfo();
    const machineId = licenseManager.getMachineId();

    res.json({
        success: true,
        licensed: info !== null || checkResult.isMaster,
        isMaster: checkResult.isMaster || false,  // ← New field
        info,
        machineId
    });
});
```

### 3. **dashboard/dashboard.js**

**Cập nhật hiển thị license status:**
```javascript
if (data.isMaster) {
    statusIcon.textContent = '👑';
    statusText.textContent = 'Master Version';
    licenseStatus.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
    licenseStatus.style.color = '#000';
}
```

---

## 🎨 Giao Diện

### Master Version:
```
┌─────────────────────────┐
│ 👑 Master Version       │ ← Badge vàng gold
└─────────────────────────┘
```

### Customer Version (Licensed):
```
┌─────────────────────────┐
│ ✅ Licensed (30d)       │ ← Badge xanh
└─────────────────────────┘
```

### Customer Version (No License):
```
┌─────────────────────────┐
│ ❌ No License           │ ← Badge đỏ
└─────────────────────────┘
```

---

## 🔄 Hành Vi

### Master Version (Có admin.html):
- ✅ Không cần license key
- ✅ Tự động bypass tất cả license checks
- ✅ Hiển thị "👑 Master Version"
- ✅ Badge màu vàng gold
- ✅ Có thể tạo packages cho khách hàng
- ✅ Có admin panel

### Customer Version (Không có admin.html):
- ❌ Cần license key
- ❌ Phải kích hoạt license
- ✅ Hiển thị "✅ Licensed" hoặc "❌ No License"
- ❌ Không có admin panel
- ❌ Không thể tạo packages

---

## 📦 Build Package Cho Khách Hàng

Khi build package cho khách hàng, admin-api.js sẽ tự động xóa:
- ❌ `dashboard/admin.html` → Không còn admin panel
- ❌ `dashboard/admin-api.js` → Không còn admin API

**Kết quả:**
- Tool customer không có `admin.html`
- `isAdminVersion()` return `false`
- Cần license key để hoạt động

---

## 🧪 Testing

### Test Master Version:
1. Đảm bảo có file `dashboard/admin.html`
2. Khởi động dashboard: `npm run dashboard`
3. Mở: `http://localhost:3000`
4. Kiểm tra:
   - ✅ License status: "👑 Master Version"
   - ✅ Badge màu vàng
   - ✅ Không cần nhập license key
   - ✅ Tất cả tools hoạt động

### Test Customer Version:
1. Xóa file `dashboard/admin.html` (tạm thời)
2. Khởi động dashboard
3. Kiểm tra:
   - ❌ License status: "❌ No License"
   - ❌ Cần nhập license key
   - ❌ Tools không hoạt động cho đến khi có license

---

## 🎯 Use Cases

### Developer/Master:
```
✅ Có admin.html
✅ Không cần license
✅ Tạo packages cho khách
✅ Test tất cả tính năng
```

### Customer:
```
❌ Không có admin.html
❌ Cần license key
❌ Không tạo được packages
✅ Chỉ dùng tools
```

---

## 🔒 Security

### Master Version:
- File `admin.html` là marker để phát hiện master version
- Khi build package, file này bị xóa tự động
- Customer không thể fake master version

### Customer Version:
- Không có `admin.html` → Cần license
- License được validate với secret key
- Machine binding (optional)
- Expiry check

---

## 📝 API Response

### Master Version:
```json
{
  "success": true,
  "licensed": true,
  "isMaster": true,
  "info": {
    "username": "Master",
    "isLifetime": true,
    "created": 1234567890,
    "expiry": -1,
    "remainingDays": -1
  },
  "machineId": "abc123..."
}
```

### Customer Version (Licensed):
```json
{
  "success": true,
  "licensed": true,
  "isMaster": false,
  "info": {
    "username": "customer001",
    "isLifetime": false,
    "created": 1234567890,
    "expiry": 1237159890,
    "remainingDays": 30
  },
  "machineId": "xyz789..."
}
```

### Customer Version (No License):
```json
{
  "success": true,
  "licensed": false,
  "isMaster": false,
  "info": null,
  "machineId": "xyz789..."
}
```

---

## ✅ Advantages

### Cho Developer:
- ✅ Không cần tạo license cho bản master
- ✅ Test dễ dàng
- ✅ Không bị expire
- ✅ Tạo packages nhanh chóng

### Cho Customer:
- ✅ Bảo mật: Không thể bypass license
- ✅ Rõ ràng: Cần license để dùng
- ✅ Công bằng: Phải mua license

---

## 🎉 Kết Quả

- ✅ Master version không cần license
- ✅ Customer version vẫn cần license
- ✅ Tự động phát hiện dựa trên `admin.html`
- ✅ Badge đẹp cho master version (👑 vàng gold)
- ✅ Bảo mật: Customer không thể fake
- ✅ Dễ maintain: Chỉ cần check 1 file
