# Customer Machine Manager

## 🎯 Mục Đích
Quản lý Machine ID và License Key cho từng khách hàng một cách dễ dàng, tránh phải nhập lại Machine ID mỗi lần tạo license.

## ✨ Tính Năng

### 1. Quản Lý Customers
- ➕ **Thêm khách hàng mới** với Machine ID
- ✏️ **Sửa thông tin** khách hàng
- 🗑️ **Xóa khách hàng** không cần thiết
- 🔍 **Tìm kiếm** theo tên, Machine ID, ghi chú

### 2. Quản Lý License Keys
- 🔑 **Tạo license key** trực tiếp cho khách hàng
- 📋 **Lưu lịch sử** tất cả license keys đã tạo
- ⏰ **Chọn thời hạn**: 7, 15, 30, 60, 90, 180, 365 ngày hoặc vĩnh viễn
- 📝 **Ghi chú** cho từng license

### 3. Thống Kê & Báo Cáo
- 📊 **Tổng số khách hàng**
- ✅ **Số license đang hoạt động**
- 📈 **Khách hàng có/chưa có license**

## 🏗️ Cấu Trúc Hệ Thống

### Backend Components

#### 1. CustomerMachineManager Class
```javascript
// dashboard/customer-machine-manager.js
class CustomerMachineManager {
    addOrUpdateCustomer(customerName, machineId, notes)
    getCustomer(customerName)
    getMachineId(customerName)
    getAllCustomers()
    removeCustomer(customerName)
    addLicenseToHistory(customerName, licenseKey, expiryDays, notes)
    getCurrentLicense(customerName)
    searchCustomers(query)
    getStats()
}
```

#### 2. API Endpoints
```javascript
GET    /api/admin/customers                           // Lấy danh sách customers
POST   /api/admin/customers                           // Thêm/sửa customer
GET    /api/admin/customers/:customerName             // Lấy thông tin customer
DELETE /api/admin/customers/:customerName             // Xóa customer
POST   /api/admin/customers/:customerName/generate-license // Tạo license
GET    /api/admin/customers/search/:query             // Tìm kiếm
```

#### 3. Data Storage
```json
// customer-machines.json
{
  "CUSTOMER_NAME": {
    "customerName": "CUSTOMER_NAME",
    "machineId": "48b62c73fe0a524f",
    "notes": "Ghi chú về khách hàng",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-10T10:00:00.000Z",
    "updateCount": 0,
    "licenseHistory": [
      {
        "licenseKey": "eyJ1c2VybmFtZSI6...",
        "expiryDays": 30,
        "notes": "License đầu tiên",
        "createdAt": "2025-01-10T10:00:00.000Z",
        "isActive": true
      }
    ]
  }
}
```

### Frontend Components

#### 1. Customer Manager UI
- 📱 **Responsive design** cho mobile/desktop
- 🎨 **Modern UI** với gradient và animations
- 📊 **Dashboard thống kê** trực quan
- 🔍 **Real-time search** không cần reload

#### 2. Modal Forms
- ➕ **Add/Edit Customer Modal**
- 🔑 **Generate License Modal** với preview license key
- 📋 **Copy to clipboard** functionality

## 🚀 Cách Sử Dụng

### 1. Truy Cập Customer Manager
```
http://localhost:3000/admin/customers
```

### 2. Thêm Khách Hàng Mới
1. Click **"➕ Thêm Khách Hàng"**
2. Nhập **Tên khách hàng** và **Machine ID**
3. Thêm **ghi chú** (tùy chọn)
4. Click **"Lưu"**

### 3. Tạo License Key
1. Tìm khách hàng trong danh sách
2. Click **"🔑 Tạo License"**
3. Chọn **thời hạn** (7-365 ngày hoặc vĩnh viễn)
4. Thêm **ghi chú** (tùy chọn)
5. Click **"🔑 Tạo License"**
6. **Copy license key** và gửi cho khách hàng

### 4. Quản Lý Khách Hàng
- **Sửa**: Click **"✏️ Sửa"** để cập nhật thông tin
- **Xóa**: Click **"🗑️ Xóa"** để xóa khách hàng
- **Tìm kiếm**: Gõ vào ô tìm kiếm để lọc danh sách

## 🔄 Workflow Cải Tiến

### Trước Khi Có Customer Manager:
```
1. Khách hàng gửi Machine ID qua chat/email
2. Admin phải copy/paste Machine ID
3. Chạy command line để tạo license
4. Dễ nhầm lẫn và mất thời gian
```

### Sau Khi Có Customer Manager:
```
1. Lần đầu: Lưu khách hàng + Machine ID vào hệ thống
2. Các lần sau: Chỉ cần click "Tạo License"
3. Tự động sử dụng Machine ID đã lưu
4. Lưu lịch sử tất cả license keys
5. Quản lý tập trung, không bị thất lạc
```

## 📊 Lợi Ích

### 1. Tiết Kiệm Thời Gian
- ⚡ **Tạo license nhanh** chỉ với vài click
- 🔄 **Không cần nhập lại** Machine ID
- 📋 **Tự động copy** license key

### 2. Giảm Sai Sót
- ✅ **Machine ID chính xác** (lưu một lần)
- 🔒 **Secret key đúng** (tự động load từ customer package)
- 📝 **Lịch sử đầy đủ** (không bị mất)

### 3. Quản Lý Tốt Hơn
- 👥 **Danh sách khách hàng** tập trung
- 📊 **Thống kê trực quan**
- 🔍 **Tìm kiếm nhanh**
- 📱 **Responsive** trên mọi thiết bị

### 4. Bảo Mật
- 🔐 **Chỉ admin** mới truy cập được
- 💾 **Dữ liệu local** (không lên cloud)
- 🗂️ **Backup dễ dàng** (export/import JSON)

## 🔧 Technical Details

### Security
- ✅ Admin-only access (requires admin.html)
- ✅ Local data storage (customer-machines.json)
- ✅ No sensitive data in URLs
- ✅ Proper error handling

### Performance
- ⚡ Client-side search (no server calls)
- 📱 Responsive design
- 🎨 Smooth animations
- 💾 Efficient data structure

### Scalability
- 📈 Supports unlimited customers
- 🔍 Fast search even with many records
- 💾 JSON storage (can migrate to DB later)
- 🔄 Easy backup/restore

## 📝 Future Enhancements

1. **License Expiry Notifications**
2. **Bulk License Generation**
3. **Customer Groups/Categories**
4. **License Usage Analytics**
5. **Email Integration**
6. **Database Migration**