# 🎰 Swipe Carousel - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Thêm hiệu ứng **vuốt từ trên xuống** (vertical swipe) cho phần hiển thị ảnh chụp kết quả của NOHU Tool, giống như card profile viewer.

## ✨ Tính Năng

✅ **Vuốt mượt mà** - Animation smooth khi vuốt từ trên xuống  
✅ **Đa nền tảng** - Hỗ trợ chuột, touch (mobile), và bàn phím  
✅ **Nút điều hướng** - ▲ ▼ buttons thông minh (disable ở đầu/cuối)  
✅ **Bộ đếm ảnh** - Hiển thị vị trí hiện tại (ví dụ: 3 / 7)  
✅ **Responsive** - Tự động điều chỉnh trên mobile  
✅ **Keyboard shortcuts** - ↑ ↓ để điều hướng  

## 🎯 Cách Sử Dụng

### 1. **Vuốt bằng chuột**
```
Nhấn và kéo chuột từ trên xuống → Xem ảnh tiếp theo
Nhấn và kéo chuột từ dưới lên → Xem ảnh trước đó
```

### 2. **Vuốt trên mobile**
```
Vuốt ngón tay từ trên xuống → Xem ảnh tiếp theo
Vuốt ngón tay từ dưới lên → Xem ảnh trước đó
```

### 3. **Dùng nút điều hướng**
```
Click ▲ → Ảnh trước
Click ▼ → Ảnh tiếp theo
```

### 4. **Dùng bàn phím**
```
↑ (Mũi tên lên) → Ảnh trước
↓ (Mũi tên xuống) → Ảnh tiếp theo
```

## 🔧 Cài Đặt Kỹ Thuật

### File Chính
- `dashboard/tools-ui/shared/shared.js` - Chứa logic swipe carousel

### Hàm Chính
```javascript
// Khởi tạo swipe carousel
initSwipeCarousel()

// Thêm CSS styles
addSwipeCarouselStyles()
```

### Tự động Kích Hoạt
Swipe carousel tự động kích hoạt khi mở modal ảnh:
```javascript
function openScreenshotsModal(title, content) {
    // ... code cũ ...
    
    // Tự động init swipe carousel
    setTimeout(() => {
        initSwipeCarousel();
    }, 100);
}
```

## 📱 Responsive Design

| Thiết bị | Kích thước | Nút | Bộ đếm |
|---------|-----------|-----|--------|
| Desktop | 100% | 32px | 14px |
| Tablet | 100% | 28px | 13px |
| Mobile | 100% | 24px | 12px |

## 🎨 Tùy Chỉnh Giao Diện

### Thay đổi màu nền
```css
.swipe-carousel {
    background: #1a202c; /* Thay đổi màu ở đây */
}
```

### Thay đổi tốc độ animation
```css
.swipe-container {
    transition: transform 0.3s ease-out; /* Thay 0.3s thành giá trị khác */
}
```

### Thay đổi độ trong suốt nút
```css
.swipe-nav-btn {
    background: rgba(255, 255, 255, 0.2); /* Thay 0.2 thành 0.3, 0.4, etc */
}
```

## 🧪 Test

### Cách test
1. Mở file: `http://localhost:3000/test-swipe-carousel.html`
2. Thử vuốt bằng chuột
3. Thử click nút ❮ ❯
4. Thử dùng bàn phím ← →

### Demo Sites
- 3388code-store
- go88code-store
- nohucode-shop
- 789pcode-store
- mmoocode-shop
- 88vcode-com

## 🐛 Troubleshooting

### Swipe không hoạt động
**Nguyên nhân:** Modal chưa được khởi tạo đúng  
**Giải pháp:** Kiểm tra console log, đảm bảo `initSwipeCarousel()` được gọi

### Animation bị giật
**Nguyên nhân:** CSS transition bị override  
**Giải pháp:** Kiểm tra file CSS khác, xóa conflicting styles

### Nút điều hướng không hiển thị
**Nguyên nhân:** Z-index quá thấp  
**Giải pháp:** Tăng z-index trong CSS

## 📊 Performance

- **Lightweight:** ~5KB JavaScript code
- **No dependencies:** Không cần thư viện bên ngoài
- **Smooth 60fps:** Animation mượt trên tất cả thiết bị
- **Mobile optimized:** Touch events được optimize

## 🔄 Cập Nhật Trong Tương Lai

Có thể thêm:
- ✨ Zoom ảnh (pinch to zoom)
- 🎬 Transition effects (fade, slide, etc)
- 📍 Thumbnail preview
- 💾 Save/download ảnh
- 🔄 Auto-play slideshow

## 📝 Ghi Chú

- Swipe carousel chỉ kích hoạt khi có **2+ ảnh**
- Nút ❮ ❯ tự động disable ở đầu/cuối
- Bộ đếm hiển thị format: `Ảnh hiện tại / Tổng số ảnh`
- Drag threshold = 50px (cần kéo ít nhất 50px để trigger swipe)

---

**Tạo bởi:** Kiro AI  
**Ngày:** 2025-12-17  
**Version:** 1.0
