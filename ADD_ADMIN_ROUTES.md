# 🎛️ THÊM ADMIN UI VÀO DASHBOARD

## ✅ Đã Tạo

1. **dashboard/admin.html** - UI quản lý packages
2. **dashboard/admin-api.js** - API xử lý backend

## 📝 Cần Thêm Vào Server

Mở file `dashboard/server.js` và thêm các routes sau:

### 1. Import Admin API (Thêm ở đầu file)

```javascript
const adminAPI = require('./admin-api');
```

### 2. Thêm Routes (Thêm trước `app.listen`)

```javascript
// ============================================
// ADMIN ROUTES - Package Management
// ============================================

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Build package
app.post('/api/admin/build-package', async (req, res) => {
    try {
        const result = await adminAPI.buildPackage(req.body);
        res.json(result);
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// List packages
app.get('/api/admin/packages', async (req, res) => {
    try {
        const result = await adminAPI.listPackages();
        res.json(result);
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Delete package
app.delete('/api/admin/delete-package/:name', async (req, res) => {
    try {
        const result = await adminAPI.deletePackage(req.params.name);
        res.json(result);
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// Download package (ZIP)
app.get('/api/admin/download-package/:name', async (req, res) => {
    try {
        const packageName = req.params.name;
        const zipPath = path.join(__dirname, '..', 'temp', `${packageName}.zip`);
        
        // Create temp folder if not exists
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create ZIP
        await adminAPI.createZip(packageName, zipPath);
        
        // Send file
        res.download(zipPath, `${packageName}.zip`, (err) => {
            // Clean up
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
```

### 3. Cài Đặt Package Cần Thiết

```batch
npm install archiver
```

## 🎯 Cách Sử Dụng

### 1. Thêm Routes Vào Server

Copy các routes ở trên vào file `dashboard/server.js`

### 2. Cài Đặt Dependencies

```batch
npm install archiver
```

### 3. Restart Server

```batch
npm run dashboard
```

### 4. Truy Cập Admin UI

Mở browser: **http://localhost:3000/admin**

## 🎨 Tính Năng Admin UI

### ✅ Tạo Package
- Nhập tên khách hàng
- Chọn loại license (Trial/Monthly/Quarterly/Lifetime)
- Chọn machine binding
- Chọn obfuscate code
- Click "Tạo Package"

### ✅ Quản Lý Packages
- Xem danh sách tất cả packages
- Thông tin: Tên, ngày tạo, kích thước
- Download package (ZIP)
- Xóa package

### ✅ Progress Bar
- Hiển thị tiến trình build
- Thông báo khi hoàn thành
- Hiển thị secret key

## 🔐 Bảo Mật

### Khuyến Nghị:

1. **Thêm Authentication**
   - Chỉ admin mới truy cập được `/admin`
   - Thêm login page
   - Check session/token

2. **Rate Limiting**
   - Giới hạn số lần build
   - Tránh spam

3. **Validation**
   - Validate input
   - Check file paths
   - Prevent directory traversal

## 📝 Code Mẫu Thêm Vào server.js

```javascript
// Ở đầu file, sau các require khác
const adminAPI = require('./admin-api');

// Trước app.listen(), thêm:

// ============================================
// ADMIN ROUTES
// ============================================

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/api/admin/build-package', async (req, res) => {
    const result = await adminAPI.buildPackage(req.body);
    res.json(result);
});

app.get('/api/admin/packages', async (req, res) => {
    const result = await adminAPI.listPackages();
    res.json(result);
});

app.delete('/api/admin/delete-package/:name', async (req, res) => {
    const result = await adminAPI.deletePackage(req.params.name);
    res.json(result);
});

app.get('/api/admin/download-package/:name', async (req, res) => {
    try {
        const packageName = req.params.name;
        const zipPath = path.join(__dirname, '..', 'temp', `${packageName}.zip`);
        
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        await adminAPI.createZip(packageName, zipPath);
        
        res.download(zipPath, `${packageName}.zip`, (err) => {
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
```

## 🚀 Hoàn Tất!

Sau khi thêm routes và restart server, bạn có thể:

1. Truy cập: http://localhost:3000/admin
2. Tạo packages trực tiếp từ UI
3. Quản lý tất cả packages
4. Download ZIP để gửi khách hàng

**Dễ dàng và chuyên nghiệp hơn nhiều! 🎉**
