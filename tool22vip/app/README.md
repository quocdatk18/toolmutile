# 🎰 Auto Register Tool - Extension Chrome

Tool tự động đăng ký tài khoản, thiết lập rút tiền, xác thực SĐT và nhận khuyến mãi cho các trang web.

## 📋 Tính năng

### 1. 🔐 Đăng Ký Tài Khoản
- Tự động điền form đăng ký (username, password, fullname)
- Hỗ trợ đăng ký nhiều trang cùng lúc (parallel mode)
- Tự động submit form (tùy chọn)
- Human-like behavior để tránh bot detection

### 2. 💰 Thiết Lập Rút Tiền
- Tự động thiết lập mật khẩu rút tiền (6 số)
- Tự động thêm tài khoản ngân hàng
- Hỗ trợ 65+ ngân hàng Việt Nam (VietQR API)
- Xử lý redirect tự động sau khi thiết lập password
- Skip trang đã có ngân hàng

### 3. 📱 Xác Thực Số Điện Thoại
- Tích hợp API codesim.net
- Tự động lấy số điện thoại ảo
- Tự động nhận và điền OTP
- Hỗ trợ xác thực nhiều trang cùng lúc

### 4. 🎁 Nhận Khuyến Mãi
- Tự động nhận khuyến mãi cho tài khoản đã xác thực SĐT
- Tự động đóng popup quảng cáo
- Lưu kết quả nhận khuyến mãi

## 🚀 Cài đặt

1. Tải source code
2. Mở Chrome → `chrome://extensions`
3. Bật "Developer mode"
4. Click "Load unpacked"
5. Chọn thư mục `app`

## 📖 Hướng dẫn sử dụng

### Đăng ký tài khoản

1. Mở popup extension
2. Tab "Đăng Ký"
3. Điền thông tin:
   - Username
   - Password (6-12 ký tự)
   - Họ tên
4. Chọn các trang muốn đăng ký
5. Click "Đăng Ký Tự Động"

### Thiết lập rút tiền

1. Tab "Rút Tiền"
2. Điền thông tin:
   - Mật khẩu rút tiền (6 số)
   - Số tài khoản ngân hàng
   - Chọn ngân hàng
3. Chọn các trang
4. Click "Thiết Lập Rút Tiền & Thêm Bank"

### Xác thực SĐT

1. Tab "Xác Thực SĐT"
2. Nhập API key từ codesim.net
3. Chọn các trang
4. Click "Xác Thực SĐT Tự Động"

### Nhận khuyến mãi

1. Tab "Khuyến Mãi"
2. Chọn các trang (đã xác thực SĐT)
3. Click "Nhận Khuyến Mãi"

## 🔧 Các fix đã áp dụng

### 1. Keep-Alive Service Worker
- Service worker không bị Chrome terminate
- Ping mỗi 20 giây để giữ kết nối

### 2. Auto-Reconnect
- Tự động re-inject script khi connection bị đứt
- Retry 5 lần với timeout 10 giây
- Phát hiện và xử lý lỗi `ERR_CONNECTION_CLOSED`

### 3. Smart Redirect Handling
- Lưu dữ liệu trước khi redirect
- Tự động navigate đến trang withdraw sau redirect
- Re-inject script tự động khi trang load

### 4. Flexible Button Detection
- Tìm button bằng text thay vì class cụ thể
- Fallback 2 lớp: class → text
- Không phụ thuộc vào HTML structure

### 5. Smart Page State Detection
- Phát hiện trang đã có mật khẩu / chưa có mật khẩu
- Phát hiện trang đã có ngân hàng / chưa có ngân hàng
- Tự động skip trang đã hoàn thành

## 📁 Cấu trúc file

```
app/
├── manifest.json          # Extension config
├── background.js          # Service worker (xử lý logic chính)
├── content.js            # Content script (tương tác với trang web)
├── popup.html            # UI popup
├── popup.js              # Logic popup
├── styles.css            # Styles
├── icon*.png             # Icons
├── README.md             # File này
├── QUICK_GUIDE_VI.md     # Hướng dẫn nhanh
├── UPDATE_LOG.md         # Lịch sử cập nhật
└── FIX_*.md              # Tài liệu các fix
```

## 🐛 Troubleshooting

### Tool không mở tab
1. Reload extension ở `chrome://extensions`
2. Click "Service Worker" để xem console
3. Kiểm tra có lỗi gì không

### Script bị ngắt giữa chừng
1. Kiểm tra permission `webNavigation` trong manifest.json
2. Xem console background có log "Keep-alive ping" không
3. Reload extension

### Không tìm thấy button
1. Kiểm tra trang web có thay đổi HTML không
2. Xem console có log "Page text: ..." để debug
3. Cập nhật selector trong code

## 📝 Lưu ý

- Tool chỉ hoạt động với các trang web tương thích
- Cần API key từ codesim.net cho tính năng xác thực SĐT
- Mỗi lần sửa code phải reload extension
- Service worker có thể bị terminate sau 30 giây không hoạt động

## 🔐 Bảo mật

- Không lưu password vào storage
- API key được lưu local trong Chrome
- Dữ liệu tự động xóa sau 60 giây
- Không gửi dữ liệu ra ngoài (trừ API codesim.net)

## 📊 Performance

- Parallel mode: Mở tất cả tab cùng lúc
- Keep-alive: Giữ service worker luôn sống
- Smart retry: Tự động retry khi lỗi
- Timeout: 10-40 giây tùy tính năng

## 🎯 Roadmap

- [ ] Hỗ trợ thêm trang web
- [ ] Cải thiện bot detection avoidance
- [ ] Thêm tính năng export/import config
- [ ] Dashboard để xem thống kê

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra console (background + content)
2. Đọc file `QUICK_GUIDE_VI.md`
3. Xem các file `FIX_*.md` để hiểu các fix đã áp dụng

---

**Version:** 1.0.0  
**Last Updated:** 2024
