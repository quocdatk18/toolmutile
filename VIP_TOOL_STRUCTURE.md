# VIP Tool - Cấu Trúc & Hướng Dẫn

## 📁 Cấu Trúc Thư Mục

```
tools/vip-tool/
├── extension/                    # Extension files (tương tự nohu)
├── vip-automation.js            # Automation logic với 4 category handlers
└── [các file khác sẽ thêm sau]

dashboard/tools-ui/vip/
├── vip.html                     # Giao diện UI (giống nohu)
└── vip.css                      # Styling
```

## 🎯 4 Category Handlers

### 1. **OKVIP** (`handleOKVIP`)
- Form fields: `username`, `password`, `email`, `phone`
- Sites: OKVip1, OKVip2, OKVip3
- Color: `#ff6b35` (cam)

### 2. **ABCVIP** (`handleABCVIP`)
- Form fields: `formcontrolname="account"`, `formcontrolname="password"`, `formcontrolname="fullname"`, `formcontrolname="phone"`
- Sites: ABCVip1, ABCVip2, ABCVip3
- Color: `#0066cc` (xanh)

### 3. **JUN88** (`handleJUN88`)
- Form fields: `id="username"`, `id="password"`, `id="fullname"`, `id="bankAccount"`
- Sites: Jun881, Jun882, Jun883
- Color: `#00aa00` (xanh lá)

### 4. **KJC** (`handleKJC`)
- Form fields: `data-field="username"`, `data-field="password"`, `data-field="email"`, `data-field="phone"`
- Sites: KJC1, KJC2, KJC3
- Color: `#cc0000` (đỏ)

## 🎨 Giao Diện UI

### Layout (Giống NOHU)
- **2 Tab**: 🤖 Tự Động | 🎁 Check KM
- **Left Column**: 
  - 🎯 Chọn Category (Radio buttons: OKVIP, ABCVIP, JUN88, KJC)
  - 📱 Chọn Sites (Grid hiển thị sites theo category)
  - ⚙️ Chế Độ Chạy (Song Song / Tuần Tự)
- **Right Column**:
  - 📋 Chọn Profile (Carousel)
  - 👤 Thông Tin Tài Khoản (Form inputs)

### Tính Năng
- Khi chọn category → Sites grid tự động cập nhật
- Giữ nguyên 2 tab tự động và khuyến mãi
- Giữ nguyên khung chọn site, chọn profile, form dưới profile
- Giữ nguyên khung chế độ chạy

## 🔧 Cách Sử Dụng

### 1. Thêm URL Sites
Cập nhật `getSitesByCategory()` trong `vip-automation.js`:
```javascript
'okvip': {
    sites: [
        {
            name: 'OKVip1',
            registerUrl: 'https://...',
            withdrawUrl: 'https://...',
            checkPromoUrl: 'https://...'
        },
        // ...
    ]
}
```

### 2. Tùy Chỉnh Form Filling Logic
Mỗi category có hàm riêng:
- `handleOKVIP()` - Điền form OKVIP
- `handleABCVIP()` - Điền form ABCVIP
- `handleJUN88()` - Điền form JUN88
- `handleKJC()` - Điền form KJC

Cập nhật selectors theo form structure thực tế của từng site.

### 3. Thêm Extension Files
Copy từ `tools/nohu-tool/extension/` và tùy chỉnh cho vip-tool.

## 📋 Danh Sách Công Việc

- [ ] Cập nhật URL sites thực tế cho 4 category
- [ ] Tùy chỉnh form selectors cho từng category
- [ ] Thêm extension files
- [ ] Test automation flow
- [ ] Thêm error handling & retry logic
- [ ] Thêm logging & debugging
- [ ] Test UI interactions
- [ ] Thêm promo checking logic

## 🚀 Tiếp Theo

1. Bạn cần cung cấp URL sites thực tế cho 4 category
2. Cung cấp form structure (HTML selectors) cho từng category
3. Tôi sẽ cập nhật automation logic
4. Test & debug
