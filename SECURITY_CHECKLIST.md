# 🔒 SECURITY CHECKLIST - Trước khi gửi package cho khách

## ✅ Checklist tự động (khi build qua Admin UI)

Khi bạn build package qua Admin UI (`http://localhost:3000/admin`), các bước sau được thực hiện TỰ ĐỘNG:

### 1. ✅ Xóa Admin Files
- ❌ `dashboard/admin.html` - Trang admin
- ❌ `dashboard/admin-api.js` - API tạo package

### 2. ✅ Xóa Sensitive Files
- ❌ `tools/generate-license.js` - Tool tạo license
- ❌ `tools/obfuscate-*.js` - Tools obfuscate
- ❌ `license-records/` - Lịch sử license
- ❌ `customer-packages/` - Packages khác
- ❌ `.license` - License của bạn
- ❌ `.git/` - Git history
- ❌ Tất cả `.bat` và `.md` files

### 3. ✅ Thay đổi Secret Key
- Secret key được generate unique cho mỗi khách hàng
- Format: `SECRET_<customer>_<random>_<random>`
- Được nhúng vào `core/license-manager.js`

### 4. ✅ Clean Config Files
- `config/settings.json` - Xóa API keys
- `.env` - Xóa environment variables

### 5. ✅ Tạo Files cho khách
- ✅ `LICENSE_KEY.txt` - License key
- ✅ `README.txt` - Hướng dẫn cài đặt
- ✅ `START.bat` - Script khởi động

---

## 📦 Files được GIỮ LẠI cho khách

```
customer-packages/<customer_name>/
├── core/                    # Core modules (với secret key mới)
├── dashboard/               # Dashboard UI (KHÔNG có admin)
├── config/                  # Config files (đã clean)
├── tools/                   # Tool scripts (đã xóa sensitive)
├── package.json
├── package-lock.json
├── .env                     # Empty
├── LICENSE_KEY.txt          # ✅ License key
├── README.txt               # ✅ Hướng dẫn
└── START.bat                # ✅ Script khởi động
```

---

## 🔐 Files được LƯU TRỮ cho bạn

```
customer-packages/
└── <customer_name>_SECRET_KEY.txt    # ⚠️ QUAN TRỌNG - Lưu giữ file này!
```

**Nội dung:**
- Customer name
- Secret key (để tạo license mới sau này)
- License type
- Machine ID (nếu có binding)
- Ngày tạo

---

## ⚠️ KIỂM TRA THỦ CÔNG (nếu cần)

Nếu bạn tạo package bằng cách khác (không qua Admin UI), hãy kiểm tra:

### 1. Kiểm tra Admin Files
```bash
# Không được tồn tại:
customer-packages/<name>/dashboard/admin.html
customer-packages/<name>/dashboard/admin-api.js
```

### 2. Kiểm tra Secret Key
```bash
# Mở file này:
customer-packages/<name>/core/license-manager.js

# Tìm dòng:
this.secretKey = 'SECRET_<customer>_<random>_<random>';

# KHÔNG được là:
this.secretKey = 'HIDEMIUM_TOOL_SECRET_2024';  # ❌ SAI!
```

### 3. Test Package
```bash
cd customer-packages/<name>
npm install
npm run dashboard

# Thử truy cập:
http://localhost:3000        # ✅ OK - Dashboard
http://localhost:3000/admin  # ❌ 403 - Admin disabled
```

---

## 🚀 Quy trình gửi cho khách

1. **Build package qua Admin UI**
   - Vào `http://localhost:3000/admin`
   - Điền thông tin khách hàng
   - Click "Build Package"

2. **Lưu Secret Key**
   - Copy file `customer-packages/<name>_SECRET_KEY.txt`
   - Lưu vào nơi an toàn (Google Drive, Notion, v.v.)

3. **Nén package**
   - Nén folder `customer-packages/<name>/`
   - Hoặc dùng nút "Download ZIP" trong Admin UI

4. **Gửi cho khách**
   - Gửi file ZIP
   - Gửi kèm hướng dẫn trong `README.txt`

5. **Hỗ trợ khách kích hoạt**
   - Khách giải nén
   - Chạy `START.bat`
   - Kích hoạt license từ `LICENSE_KEY.txt`

---

## 🔄 Nếu cần tạo license mới

Nếu khách hàng cần gia hạn hoặc tạo license mới:

1. Lấy Secret Key từ file `<customer>_SECRET_KEY.txt`
2. Dùng tool `generate-license.js` với secret key đó
3. Gửi license key mới cho khách
4. Khách activate lại trong dashboard

---

## ❌ KHÔNG BAO GIỜ

- ❌ Gửi file `_SECRET_KEY.txt` cho khách hàng
- ❌ Gửi package có `admin.html` hoặc `admin-api.js`
- ❌ Gửi package có secret key mặc định `HIDEMIUM_TOOL_SECRET_2024`
- ❌ Gửi package có `.license` file (license của bạn)
- ❌ Gửi package có `license-records/` folder

---

## 📞 Support

Nếu khách hàng vẫn vào được `/admin`:
1. Xóa package cũ
2. Build lại package mới qua Admin UI
3. Kiểm tra lại không có `admin.html` và `admin-api.js`
