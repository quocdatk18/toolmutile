# 📊 Hướng Dẫn Sử Dụng Bảng Kết Quả

## Tổng Quan

Đã xóa toàn bộ tính năng gửi ảnh qua Telegram. Thay vào đó, kết quả automation sẽ được hiển thị trực tiếp trên Dashboard dưới dạng bảng.

## Các Thay Đổi

### ✅ Đã Xóa
- ❌ Package `telegram` (đã gỡ bỏ khỏi package.json)
- ❌ File `.env` và `.env.example` với cấu hình Telegram
- ❌ File `TELEGRAM_FEATURE_SUMMARY.md`
- ❌ Các dòng text "Kết quả sẽ tự động gửi vào Saved Messages của Telegram"

### ✨ Đã Thêm
- ✅ Bảng hiển thị kết quả automation trên Dashboard
- ✅ Hiển thị thông tin: Profile, Tài khoản, Trang, Trạng thái, Ảnh chụp, Thời gian
- ✅ Ảnh chụp màn hình dạng thumbnail (click để xem lớn)
- ✅ Tự động lưu kết quả vào localStorage
- ✅ Giới hạn 50 kết quả gần nhất

## Cấu Trúc Bảng Kết Quả

| Cột | Mô Tả |
|-----|-------|
| **Profile** | Tên profile đã sử dụng |
| **Tài Khoản** | Username đã đăng ký/đăng nhập |
| **Trang** | Tên trang web (Go99, NOHU, TT88...) |
| **Trạng Thái** | ✅ Thành Công / ❌ Lỗi / 🔄 Đang Chạy |
| **Ảnh Chụp** | Thumbnail ảnh chụp màn hình (click để xem lớn) |
| **Thời Gian** | Thời gian hoàn thành |

## Cách Sử Dụng

### 1. Xem Demo
Mở file `dashboard/tools-ui/results-demo.html` trong trình duyệt để xem demo bảng kết quả:

```bash
# Mở trực tiếp file trong trình duyệt
start dashboard/tools-ui/results-demo.html
```

### 2. Sử Dụng Trong Tool

Khi chạy automation, kết quả sẽ tự động hiển thị trong bảng ở cuối trang tool.

**Ví dụ thêm kết quả:**

```javascript
// Thêm kết quả thành công
window.addAutomationResult(
    'Profile 1',           // Tên profile
    'user123',             // Username
    'Go99',                // Tên trang
    'success',             // Trạng thái: 'success', 'error', 'running'
    '/screenshots/go99.png' // Đường dẫn ảnh chụp
);

// Thêm kết quả lỗi
window.addAutomationResult(
    'Profile 2',
    'user456',
    'NOHU',
    'error',
    null  // Không có ảnh
);
```

### 3. Tích Hợp Vào Automation

Trong file automation (ví dụ: `auto-sequence.js`), thêm code sau khi hoàn thành:

```javascript
// Sau khi đăng ký thành công
if (window.addAutomationResult) {
    window.addAutomationResult(
        profileName,
        username,
        siteName,
        'success',
        screenshotPath
    );
}
```

## API Functions

### `addResultToTable(result)`
Thêm một kết quả vào bảng.

**Parameters:**
```javascript
{
    profileName: string,   // Tên profile
    username: string,      // Tên tài khoản
    siteName: string,      // Tên trang
    status: string,        // 'success' | 'error' | 'running'
    screenshot: string,    // URL hoặc path của ảnh
    timestamp: number      // Timestamp (optional, mặc định là Date.now())
}
```

### `clearResultsTable()`
Xóa toàn bộ kết quả trong bảng.

### `showResultsSection()`
Hiển thị section bảng kết quả (tự động gọi khi có kết quả đầu tiên).

## Lưu Trữ Dữ Liệu

- Kết quả được tự động lưu vào `localStorage`
- Key: `nohu_automation_results`
- Giới hạn: 50 kết quả gần nhất
- Tự động load lại khi refresh trang

## Styling

CSS cho bảng kết quả nằm trong file `dashboard/tools-ui/nohu-tool.css`:

- `.results-table` - Style cho bảng
- `.status-badge` - Badge trạng thái
- `.screenshot-thumb` - Thumbnail ảnh (hover để phóng to)

## Ví Dụ Screenshot

Ảnh chụp màn hình nên được lưu trong thư mục `screenshots/` và có thể truy cập qua URL:

```
/screenshots/go99_user123_20231208.png
/screenshots/nohu_user456_20231208.png
```

## Lưu Ý

1. **Ảnh chụp màn hình**: Đảm bảo ảnh được lưu trong thư mục `screenshots/` và có thể truy cập qua web server
2. **Giới hạn kết quả**: Chỉ hiển thị 50 kết quả gần nhất để tránh làm chậm UI
3. **LocalStorage**: Dữ liệu lưu trong localStorage, xóa cache sẽ mất dữ liệu
4. **Responsive**: Bảng có scroll ngang trên màn hình nhỏ

## Troubleshooting

### Bảng không hiển thị
- Kiểm tra `resultsSection` có `display: none` không
- Gọi `showResultsSection()` để hiển thị

### Ảnh không hiển thị
- Kiểm tra đường dẫn ảnh có đúng không
- Đảm bảo web server có serve thư mục `screenshots/`

### Kết quả không lưu
- Kiểm tra localStorage có bị disable không
- Xem console có lỗi không

## Tương Lai

Có thể mở rộng thêm:
- Export kết quả ra CSV/Excel
- Filter theo profile, trang, trạng thái
- Thống kê tỷ lệ thành công
- Xem chi tiết log của từng kết quả
