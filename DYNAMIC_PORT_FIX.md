# ✅ Sửa Lỗi Port Động - Hoàn Chỉnh

## 🐛 Vấn Đề
Khi tạo package, API mặc định gọi port 3000, nhưng server có thể đang chạy trên port khác (3001, 3002...) nếu port 3000 bị chiếm.

Điều này gây lỗi khi:
- Lưu screenshot về dashboard
- Gọi API captcha/SIM
- Quản lý profiles
- Load results từ dashboard UI

## ✅ Giải Pháp
Đã sửa **TẤT CẢ** các file để tự động phát hiện port đang chạy:

### Backend (Node.js)

#### 1. **dashboard/server.js**
- Lưu port vào `global.DASHBOARD_PORT` và `process.env.DASHBOARD_PORT`
- Các script khác có thể truy cập port động

#### 2. **tools/nohu-tool/complete-automation.js**
- Lấy port từ `process.env.DASHBOARD_PORT` hoặc `global.DASHBOARD_PORT`
- Fallback về 3000 nếu không tìm thấy
- Gửi screenshot về đúng port

#### 3. **core/hidemium-api.js**
- Constructor tự động lấy port động
- Cập nhật `dashboardUrl` với port đúng

#### 4. **core/api-key-manager.js**
- Hàm `checkBalance()` dùng port động

#### 5. **core/profile-manager.js**
- Tất cả API calls (loadAll, create, start, stop, delete) dùng port động

#### 6. **core/sim-api-manager.js**
- Tất cả API calls (checkBalance, getPhoneNumber, getOTP, cancelSim) dùng port động

### Frontend (Browser)

#### 7. **dashboard/tools-ui/nohu-tool.html**
- Đổi từ `http://localhost:3000/api/...` → `/api/...` (relative URL)
- Tự động dùng port của trang hiện tại
- Sửa: loadResultsFromServer, clearResults, runAutomation

#### 8. **dashboard/tools-ui/nohu-tool.js**
- Đổi tất cả fetch từ absolute → relative URL
- Sửa: runFullSequence, runRegisterOnly, runLoginOnly, runAddBankOnly, runCheckPromoOnly

#### 9. **dashboard/tools-ui/hai2vip-tool.html**
- Đổi tất cả fetch từ absolute → relative URL
- Sửa: runFullSequence, runRegisterOnly, runLoginOnly, runWithdrawOnly, runPhoneVerifyOnly, runPromoOnly

## 🎯 Kết Quả
- ✅ Server tự động tìm port khả dụng (3000 → 3001 → 3002...)
- ✅ Backend API calls tự động dùng đúng port
- ✅ Frontend UI tự động dùng đúng port (relative URLs)
- ✅ Screenshot lưu và hiển thị thành công
- ✅ Không cần config thêm gì

## 🧪 Test
```bash
# Start dashboard (sẽ tự động tìm port)
npm run dashboard

# Nếu port 3000 bị chiếm, sẽ dùng 3001
# Tất cả automation vẫn hoạt động bình thường
# UI vẫn load được results và screenshots
```

## 📝 Lưu Ý
- **9 files đã được sửa** (6 backend + 3 frontend)
- Tất cả customer packages cũ cần rebuild để có fix này
- Fix này tương thích ngược (backward compatible)
- Relative URLs (`/api/...`) tự động dùng port của trang hiện tại
