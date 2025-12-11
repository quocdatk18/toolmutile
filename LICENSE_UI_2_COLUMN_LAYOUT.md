# 🎨 License Page - 2 Column Layout

## ✨ Cải Tiến Mới

Đã redesign trang license.html thành **layout 2 cột** để:
- ✅ Giảm chiều cao, không cần scroll nhiều
- ✅ Tận dụng không gian ngang
- ✅ Trải nghiệm người dùng tốt hơn
- ✅ Giao diện hiện đại, chuyên nghiệp

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │                  │  │                  │       │
│  │   LEFT SIDE      │  │   RIGHT SIDE     │       │
│  │   (Product Info) │  │   (License Form) │       │
│  │                  │  │                  │       │
│  │  • Title         │  │  • Header        │       │
│  │  • Features      │  │  • Status        │       │
│  │  • Contact       │  │  • Input Form    │       │
│  │                  │  │  • Machine ID    │       │
│  │                  │  │  • Back Link     │       │
│  │                  │  │                  │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Left Side - Product Info

**Nội dung:**
- 🎯 Title: "HIDEMIUM MULTI-TOOL"
- 📝 Subtitle: Mô tả ngắn gọn
- ✨ Features List: 5 tính năng chính
- 💰 Contact Box: Thông tin liên hệ (chỉ hiện khi chưa có license)

**Styling:**
- Background: Gradient tím (#667eea → #764ba2)
- Text: Màu trắng
- Padding: 40px
- Căn giữa theo chiều dọc

---

## 📝 Right Side - License Form

**Nội dung:**
- 🔐 Header: "Kích Hoạt Bản Quyền"
- 📊 Status: Hiển thị trạng thái license
- 📝 Input Form: Nhập license key
- 🖥️ Machine ID: Hiển thị mã máy
- ← Back Link: Quay lại trang chủ

**Styling:**
- Background: Trắng
- Padding: 40px
- Căn giữa theo chiều dọc

---

## 📱 Responsive Design

### Desktop (> 968px):
```
┌──────────┬──────────┐
│  Left    │  Right   │
│  Side    │  Side    │
└──────────┴──────────┘
```

### Mobile (< 968px):
```
┌──────────┐
│  Right   │  ← Form lên trước
│  Side    │
├──────────┤
│  Left    │  ← Product info xuống sau
│  Side    │
└──────────┘
```

---

## 🎨 CSS Key Features

### Grid Layout:
```css
.license-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}
```

### Centering:
```css
body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}
```

### Max Width:
```css
.license-wrapper {
    max-width: 1200px;
    width: 100%;
}
```

---

## 🔄 Dynamic Behavior

### Khi Chưa Có License:
- ✅ Contact Box hiển thị (bên trái)
- ✅ Form input enabled (bên phải)
- ✅ Nút "Kích Hoạt" hiển thị

### Khi Đã Có License:
- ❌ Contact Box ẩn đi
- ✅ License info hiển thị (bên phải)
- ✅ Form input disabled
- ✅ Nút "Xóa Bản Quyền" hiển thị

---

## 📊 Dimensions

| Element | Width | Height | Padding |
|---------|-------|--------|---------|
| Wrapper | 1200px max | Auto | - |
| Left Side | 50% | Auto | 40px |
| Right Side | 50% | Auto | 40px |
| Gap | 30px | - | - |

---

## ✅ Advantages

### Trước (1 cột):
- ❌ Chiều cao quá dài
- ❌ Phải scroll nhiều
- ❌ Lãng phí không gian ngang
- ❌ Trải nghiệm kém

### Sau (2 cột):
- ✅ Chiều cao vừa phải
- ✅ Ít scroll hơn
- ✅ Tận dụng không gian
- ✅ Trải nghiệm tốt
- ✅ Giao diện hiện đại

---

## 🎯 User Flow

1. **Mở trang license**
   - Thấy 2 cột: Product info (trái) + Form (phải)
   - Contact box hiển thị nếu chưa có license

2. **Nhập license key**
   - Paste key vào ô input (bên phải)
   - Click "Kích Hoạt Bản Quyền"

3. **Sau khi kích hoạt**
   - Contact box ẩn đi
   - License info hiển thị
   - Form disabled

4. **Responsive**
   - Mobile: Form lên trên, product info xuống dưới
   - Desktop: 2 cột song song

---

## 🚀 Testing

```bash
# 1. Khởi động dashboard
npm run dashboard

# 2. Mở trang license
http://localhost:3000/license.html

# 3. Kiểm tra:
- ✅ 2 cột hiển thị đúng
- ✅ Không cần scroll nhiều
- ✅ Contact box hiện/ẩn đúng
- ✅ Responsive trên mobile
```

---

## 💡 Tips

- Chiều rộng tối ưu: 1200px
- Gap giữa 2 cột: 30px
- Padding mỗi side: 40px
- Responsive breakpoint: 968px

---

## 🎉 Kết Quả

Giao diện giờ đây:
- 📐 Cân đối, hài hòa
- 🎨 Hiện đại, chuyên nghiệp
- 📱 Responsive tốt
- ⚡ Trải nghiệm mượt mà
- ✨ Không cần scroll nhiều!
