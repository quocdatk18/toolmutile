# 🎯 Hướng Dẫn Centralized Config - Cách Chọn Checkbox và Nhận Data

## 📋 **Tổng Quan**

Sau khi thực hiện **Centralized Config Implementation (Cách 1)**, cả NOHU Tool và SMS Tool đều đã được cập nhật để:

1. **UI chỉ gửi tên trang** thay vì URL đầy đủ
2. **optimized-automation.js lấy URL** từ site configs tập trung
3. **Không còn trùng lặp data** giữa UI và extension

## 🔄 **Luồng Hoạt Động**

### **1. Từ UI Dashboard:**
```
User chọn checkbox → UI lấy data-name → Gửi { name } hoặc { name, category }
```

### **2. Trong optimized-automation.js:**
```
Nhận { name } → Tìm trong siteConfigs[name] → Lấy registerUrl, loginUrl
```

### **3. Kết Quả:**
```
Extension có đầy đủ thông tin để chạy automation
```

## 📱 **NOHU Tool - Cách Hoạt Động**

### **HTML Checkbox:**
```html
<input type="checkbox" class="site-check" data-name="NOHU">
```

### **JavaScript UI:**
```javascript
function getSelectedSites() {
    const sites = [];
    document.querySelectorAll('.site-check:checked').forEach(checkbox => {
        const name = checkbox.getAttribute('data-name');
        sites.push({ name }); // Chỉ gửi name
    });
    return sites;
}
```

### **optimized-automation.js:**
```javascript
siteConfigs = {
    'NOHU': {
        registerUrl: 'https://m.88111188.com/Account/Register?f=6344995&app=1',
        loginUrl: 'https://m.88111188.com/?app=1',
        selectors: this.getNohuMobileSelectors()
    }
}
```

## 📱 **SMS Tool - Cách Hoạt Động**

### **HTML Checkbox:**
```html
<input type="checkbox" class="site-check okvip-check" data-name="SHBET" data-category="okvip">
```

### **JavaScript UI:**
```javascript
function getSelectedSitesForActiveCategory() {
    const sites = [];
    document.querySelectorAll('.site-check:checked').forEach(checkbox => {
        const name = checkbox.getAttribute('data-name');
        const category = checkbox.getAttribute('data-category');
        sites.push({ name, category }); // Gửi name và category
    });
    return sites;
}
```

### **optimized-automation.js:**
```javascript
siteConfigs = {
    'SHBET': {
        type: 'okvip',
        registerUrl: 'https://shbet800.com/m/register?f=123456&app=1',
        loginUrl: 'https://shbet800.com/?app=1',
        selectors: this.getOKVIPSelectors()
    }
}
```

## ✅ **Lợi Ích Của Cách 1**

### **🎯 Tập Trung Quản Lý:**
- Tất cả URL ở 1 nơi (optimized-automation.js)
- Dễ update khi trang đổi domain
- Không cần sửa UI khi thay đổi URL

### **🧹 Đơn Giản Hóa:**
- Checkbox chỉ cần `data-name` (và `data-category` cho SMS)
- JavaScript UI đơn giản hơn
- Ít lỗi inconsistency

### **🔧 Dễ Maintain:**
- Thêm trang mới: chỉ cần thêm vào siteConfigs
- Update URL: chỉ sửa 1 chỗ
- Không trùng lặp code

## 🧪 **Cách Test**

### **1. Mở file test:**
```bash
# Mở test-centralized-config.html trong browser
```

### **2. Test NOHU Tool:**
- Chọn checkbox Go99, NOHU, TT88
- Click "Test NOHU Tool"
- Xem kết quả: chỉ có `{ name }`

### **3. Test SMS Tool:**
- Chọn checkbox SHBET, J88, QQ88
- Click "Test SMS Tool"  
- Xem kết quả: có `{ name, category }`

## 🔍 **So Sánh Trước và Sau**

### **❌ Trước (Cách Cũ):**
```html
<input type="checkbox" 
       data-name="SHBET"
       data-register-link="https://shbet800.com/m/register?f=123456&app=1"
       data-promo-link=""
       data-withdraw-domain="shbet800.com">
```

```javascript
// UI phải lấy tất cả URL từ attributes
const registerUrl = checkbox.getAttribute('data-register-link');
const promoUrl = checkbox.getAttribute('data-promo-link');
// Trùng lặp data, khó maintain
```

### **✅ Sau (Cách 1):**
```html
<input type="checkbox" data-name="SHBET" data-category="okvip">
```

```javascript
// UI chỉ gửi name và category
sites.push({ name, category });
// Extension tự lấy URL từ configs
```

## 🚀 **Kết Luận**

**Centralized Config (Cách 1) đã được triển khai thành công!**

- ✅ **NOHU Tool:** Hoàn thành
- ✅ **SMS Tool:** Hoàn thành  
- ✅ **Test Cases:** Sẵn sàng
- ✅ **Documentation:** Đầy đủ

**Bây giờ bạn có thể:**
1. Chọn checkbox trong UI
2. optimized-automation.js sẽ tự động lấy URL từ site configs
3. Không cần lo về việc sync URL giữa UI và extension

**Happy Coding! 🎉**