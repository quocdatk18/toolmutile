# 📐 Hướng Dẫn Layout 2 Cột

## Tổng Quan

Layout mới sử dụng **2 cột song song**:
- **Cột Trái**: Form nhập liệu và các tab
- **Cột Phải**: Bảng kết quả (sticky, luôn hiển thị)

## Cấu Trúc Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🎰 NOHU Auto Tool (Full Width)                                 │
│  [Tabs: Tự Động | Đăng Ký | Đăng Nhập | Thêm Bank | Check KM]  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────┐
│  ⬅️ CỘT TRÁI (Flexible)      │  ➡️ CỘT PHẢI (650px, Sticky)    │
├──────────────────────────────┼──────────────────────────────────┤
│                              │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│  🎯 Chọn Trang               │  ┃ 📊 Kết Quả Automation      ┃ │
│  [GO][NO][TT][MM]...         │  ┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃ │
│                              │  ┃ Profile │ Tài Khoản │ ...  ┃ │
│  📋 Chọn Profile             │  ┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃ │
│  [Profile Carousel]          │  ┃ Profile1│ user123  │ ✅   ┃ │
│                              │  ┃ Profile2│ user456  │ ❌   ┃ │
│  👤 Thông Tin Tài Khoản      │  ┃ Profile3│ user789  │ 🔄   ┃ │
│  [Username]                  │  ┃                            ┃ │
│  [Password]                  │  ┃ ⬆️ STICKY - Luôn hiển thị  ┃ │
│  [Fullname]                  │  ┃    khi scroll              ┃ │
│                              │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│  💳 Thông Tin Ngân Hàng      │                                  │
│  [Bank Name]                 │                                  │
│  [Account Number]            │                                  │
│                              │                                  │
│  [🚀 CHẠY TỰ ĐỘNG]          │                                  │
│                              │                                  │
│  ⬇️ Scroll xuống...          │  ⬆️ Cố định ở đây              │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

## Đặc Điểm

### Cột Trái (Form Content)
- **Width**: Flexible (tự động điều chỉnh theo màn hình)
- **Scroll**: Theo nội dung form
- **Nội dung**:
  - Chọn trang (Go99, NOHU, TT88...)
  - Chọn profile (carousel)
  - Form nhập thông tin tài khoản
  - Form nhập thông tin ngân hàng
  - Nút chạy automation
  - Tất cả các tab content

### Cột Phải (Results Table)
- **Width**: Fixed 650px
- **Position**: Sticky (cố định khi scroll)
- **Max Height**: 100vh - 40px
- **Scroll**: Riêng biệt (nếu bảng quá dài)
- **Nội dung**:
  - Bảng kết quả automation
  - Hiển thị real-time
  - Ảnh chụp màn hình
  - Trạng thái (thành công/lỗi/đang chạy)

## Lợi Ích

### 1. Theo Dõi Real-Time
- ✅ Nhìn thấy kết quả ngay khi nhập form
- ✅ Không cần scroll lên xuống
- ✅ Bảng luôn hiển thị (sticky)

### 2. Tối Ưu Không Gian
- ✅ Sử dụng hiệu quả màn hình rộng
- ✅ Form và kết quả cùng lúc
- ✅ Giảm thời gian tìm kiếm thông tin

### 3. UX Tốt Hơn
- ✅ Workflow mượt mà hơn
- ✅ Dễ so sánh kết quả
- ✅ Feedback tức thì

## CSS Implementation

### Grid Layout
```css
.nohu-tool-container {
    display: grid;
    grid-template-columns: 1fr 650px; /* Left flexible, Right fixed */
    gap: 25px;
    align-items: start;
}
```

### Sticky Right Column
```css
.tool-right-column {
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
}
```

### Full Width Elements
```css
.info-banner,
.tabs {
    grid-column: 1 / -1; /* Span both columns */
}
```

## Responsive Design

### Desktop (> 1400px)
```
┌─────────────┬──────────┐
│   Form      │ Results  │
│  (Flexible) │ (650px)  │
└─────────────┴──────────┘
```

### Tablet/Mobile (< 1400px)
```
┌─────────────────────┐
│       Form          │
│    (Full Width)     │
├─────────────────────┤
│      Results        │
│    (Full Width)     │
└─────────────────────┘
```

**CSS:**
```css
@media (max-width: 1400px) {
    .nohu-tool-container {
        grid-template-columns: 1fr; /* Single column */
    }
    
    .tool-right-column {
        position: static; /* Not sticky */
        max-height: none;
    }
}
```

## Compact Table Styling

Bảng trong cột phải được tối ưu để vừa với 650px:

```css
/* Smaller font */
.tool-right-column .results-table {
    font-size: 13px;
}

/* Compact padding */
.tool-right-column .results-table th {
    padding: 12px 8px;
}

.tool-right-column .results-table td {
    padding: 10px 8px;
}

/* Smaller thumbnails */
.tool-right-column .screenshot-thumb {
    width: 50px;
    height: 38px;
}

/* Smaller badges */
.tool-right-column .status-badge {
    font-size: 11px;
    padding: 4px 8px;
}
```

## Sticky Table Header

Header của bảng cũng sticky trong cột phải:

```css
.tool-right-column .results-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## Custom Scrollbar

Scrollbar đẹp hơn cho cột phải:

```css
.tool-right-column {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
}

.tool-right-column::-webkit-scrollbar {
    width: 8px;
}

.tool-right-column::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
}
```

## Demo

### Xem Demo Layout
```bash
# Mở file demo trong browser
start dashboard/tools-ui/two-column-demo.html
```

Demo bao gồm:
- ✅ Minh họa cấu trúc 2 cột
- ✅ Form mẫu bên trái
- ✅ Bảng kết quả bên phải (sticky)
- ✅ Nút thêm kết quả để test
- ✅ Responsive design

### Xem Trong Tool Thực Tế
1. Start dashboard: `npm start`
2. Mở NOHU Tool
3. Thấy ngay layout 2 cột
4. Scroll form bên trái → Bảng bên phải vẫn cố định

## Troubleshooting

### Bảng Không Sticky?
- Kiểm tra `position: sticky` trong CSS
- Đảm bảo `top: 20px` được set
- Kiểm tra parent container không có `overflow: hidden`

### Layout Bị Vỡ?
- Kiểm tra màn hình có đủ rộng (> 1400px)
- Xem responsive breakpoint
- Kiểm tra CSS grid có load đúng không

### Bảng Quá Nhỏ?
- Tăng width của cột phải: `grid-template-columns: 1fr 750px`
- Điều chỉnh font size trong `.tool-right-column`
- Tăng padding của cells

### Scroll Không Mượt?
- Thêm `scroll-behavior: smooth`
- Kiểm tra `overflow-y: auto` trên right column
- Đảm bảo `max-height` được set đúng

## Best Practices

### 1. Giữ Bảng Compact
- Dùng font size nhỏ hơn (12-13px)
- Padding vừa phải (8-10px)
- Thumbnail nhỏ (50x38px)

### 2. Sticky Positioning
- Set `top: 20px` để có khoảng cách
- `max-height: calc(100vh - 40px)` để không bị tràn
- `overflow-y: auto` cho scroll riêng

### 3. Responsive
- Breakpoint tại 1400px
- Mobile: Stack thành 1 cột
- Tablet: Có thể giữ 2 cột nhưng thu nhỏ

### 4. Performance
- Giới hạn số kết quả (50 rows)
- Lazy load ảnh nếu cần
- Virtual scrolling cho bảng lớn

## Tương Lai

Có thể mở rộng thêm:
- [ ] Resize cột phải (drag to resize)
- [ ] Toggle show/hide bảng kết quả
- [ ] Fullscreen mode cho bảng
- [ ] Export kết quả từ bảng
- [ ] Filter/Search trong bảng
- [ ] Pin/Unpin specific results

## Kết Luận

Layout 2 cột giúp:
- ✅ Theo dõi kết quả real-time
- ✅ Workflow hiệu quả hơn
- ✅ UX tốt hơn
- ✅ Tận dụng màn hình rộng

Bảng kết quả luôn hiển thị bên phải, sticky khi scroll, giúp bạn không bao giờ bỏ lỡ kết quả automation!
