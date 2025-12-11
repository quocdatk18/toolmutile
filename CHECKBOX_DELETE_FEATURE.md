# ✅ Tính Năng Checkbox Xóa & Đếm Số Lần Check

## 🎯 Tính Năng Mới

### 1. **Cột "Số Lần Check"**
- Đếm số lần check KM trên cùng 1 tài khoản
- Hiển thị badge đẹp: "1 lần", "2 lần", "3 lần"...
- Logic: Group theo ngày để đếm các session check riêng biệt

### 2. **Checkbox Xóa Từng Dòng**
- Checkbox ở đầu mỗi dòng
- Checkbox "Select All" ở header
- Nút "Xóa Đã Chọn" để xóa có chọn lọc
- Nút "Xóa Tất Cả" vẫn giữ nguyên

---

## 📊 Cấu Trúc Bảng Mới

### Trước (6 cột):
```
| Profile | Tài Khoản | Số Trang | Trạng Thái | Kết Quả | Thời Gian |
```

### Sau (8 cột):
```
| ☑️ | Profile | Tài Khoản | Số Trang | Số Lần Check | Trạng Thái | Kết Quả | Thời Gian |
```

---

## 🔧 Cách Hoạt Động

### Đếm Số Lần Check:
```javascript
// Group theo username (không phải profileName_username)
const key = username;

// Track check times by date
const checkDate = new Date(timestamp).toDateString();
if (!resultsData[key].checkTimes.includes(checkDate)) {
    resultsData[key].checkTimes.push(checkDate);
}

// Display count
const checkTimesCount = group.checkTimes.length;
// → "1 lần", "2 lần", "3 lần"...
```

### Xóa Có Chọn Lọc:
```javascript
// 1. User chọn checkbox
// 2. Click "Xóa Đã Chọn"
// 3. Lấy danh sách username đã chọn
const selectedUsernames = [...];

// 4. Gọi API xóa
POST /api/results/clear-selected
Body: { usernames: ["user1", "user2"] }

// 5. API xóa thư mục screenshots/user1/, screenshots/user2/
// 6. Reload từ server để confirm
```

---

## 🎨 UI Components

### 1. Header Checkbox (Select All):
```html
<th style="width: 40px;">
    <input type="checkbox" id="selectAllCheckbox" 
           onchange="toggleSelectAll(this)">
</th>
```

### 2. Row Checkbox:
```html
<td style="text-align: center;">
    <input type="checkbox" class="row-checkbox" 
           data-key="${key}">
</td>
```

### 3. Check Times Badge:
```html
<td>
    <span class="check-times-badge">
        ${checkTimesCount} lần
    </span>
</td>
```

### 4. Buttons:
```html
<button onclick="refreshResults()">🔄 Tải Lại</button>
<button onclick="deleteSelectedResults()">🗑️ Xóa Đã Chọn</button>
<button onclick="clearResultsTable()">🗑️ Xóa Tất Cả</button>
```

---

## 🔌 API Endpoints

### Mới: `/api/results/clear-selected`
```javascript
DELETE /api/results/clear-selected
Body: {
    usernames: ["user1", "user2", "user3"]
}

Response: {
    success: true,
    deletedFiles: 15,
    message: "Deleted 15 file(s)"
}
```

**Logic:**
- Nhận danh sách usernames
- Xóa thư mục `screenshots/username/` cho mỗi username
- Đếm tổng số file đã xóa
- Trả về kết quả

### Giữ Nguyên: `/api/results/clear`
```javascript
DELETE /api/results/clear

Response: {
    success: true,
    deletedFiles: 50,
    message: "Deleted 50 file(s)"
}
```

**Logic:**
- Xóa toàn bộ thư mục `screenshots/`
- Xóa tất cả subfolder và file
- Trả về tổng số file đã xóa

---

## 🧪 Test Cases

### Test 1: Đếm Số Lần Check
```bash
# 1. Chạy automation cho user "test123" → Kết quả: "1 lần"

# 2. Chạy lại automation cho user "test123" (cùng ngày)
# → Vẫn hiển thị "1 lần" (cùng session)

# 3. Đợi sang ngày hôm sau, chạy lại
# → Hiển thị "2 lần" (session mới)

# 4. Chạy thêm 1 lần nữa (ngày thứ 3)
# → Hiển thị "3 lần"
```

### Test 2: Select All
```bash
# 1. Có 5 kết quả trong bảng

# 2. Click checkbox "Select All" ở header
# → Tất cả 5 checkbox được chọn

# 3. Uncheck "Select All"
# → Tất cả 5 checkbox bị bỏ chọn
```

### Test 3: Xóa Đã Chọn
```bash
# 1. Có 5 kết quả: user1, user2, user3, user4, user5

# 2. Chọn checkbox của user2 và user4

# 3. Click "Xóa Đã Chọn"
# → Confirm dialog: "Bạn có chắc muốn xóa 2 kết quả đã chọn?"

# 4. Click OK
# → API xóa screenshots/user2/ và screenshots/user4/
# → Reload bảng
# → Còn lại 3 kết quả: user1, user3, user5
# → Toast: "Đã xóa X file kết quả"
```

### Test 4: Xóa Tất Cả
```bash
# 1. Có 5 kết quả

# 2. Click "Xóa Tất Cả"
# → Confirm dialog: "Bạn có chắc muốn xóa TẤT CẢ kết quả?"

# 3. Click OK
# → API xóa toàn bộ screenshots/
# → Reload bảng
# → Hiển thị "Chưa có kết quả"
```

### Test 5: Xóa Không Chọn Gì
```bash
# 1. Không chọn checkbox nào

# 2. Click "Xóa Đã Chọn"
# → Toast warning: "Vui lòng chọn ít nhất 1 kết quả để xóa"
# → Không xóa gì
```

---

## 📝 Files Đã Sửa

### 1. **dashboard/tools-ui/nohu-tool.html**
- Thêm cột checkbox (header + rows)
- Thêm cột "Số Lần Check"
- Thêm nút "Xóa Đã Chọn"
- Thêm hàm `toggleSelectAll()`
- Thêm hàm `deleteSelectedResults()`
- Sửa logic group theo `username` thay vì `profileName_username`
- Thêm tracking `checkTimes[]` để đếm số lần check
- Thêm CSS cho `.check-times-badge` và `.btn-warning`

### 2. **dashboard/server.js**
- Thêm endpoint `/api/results/clear-selected`
- Logic xóa có chọn lọc theo username
- Giữ nguyên endpoint `/api/results/clear` (xóa tất cả)

---

## 🎯 Lợi Ích

### Trước:
- ❌ Không biết đã check KM bao nhiêu lần
- ❌ Chỉ có thể xóa toàn bộ
- ❌ Xóa 1 user phải xóa thủ công trong folder

### Sau:
- ✅ Biết rõ số lần check KM (1 lần, 2 lần, 3 lần...)
- ✅ Xóa có chọn lọc (chọn user nào xóa user đó)
- ✅ Xóa nhiều user cùng lúc
- ✅ Vẫn giữ nút "Xóa Tất Cả" cho tiện
- ✅ UI thân thiện với checkbox

---

## 💡 Use Cases

### Use Case 1: Theo Dõi Tần Suất Check
```
User muốn biết đã check KM cho tài khoản "vip123" bao nhiêu lần
→ Xem cột "Số Lần Check": "5 lần"
→ Biết đã check 5 lần (5 ngày khác nhau)
```

### Use Case 2: Dọn Dẹp Có Chọn Lọc
```
User có 20 tài khoản, muốn xóa 5 tài khoản cũ
→ Chọn 5 checkbox
→ Click "Xóa Đã Chọn"
→ Chỉ 5 tài khoản đó bị xóa, 15 tài khoản còn lại giữ nguyên
```

### Use Case 3: Xóa Nhanh Tất Cả
```
User muốn reset toàn bộ kết quả
→ Click "Xóa Tất Cả"
→ Tất cả kết quả bị xóa
```

---

## ✅ Checklist

- [x] Thêm cột checkbox
- [x] Thêm cột "Số Lần Check"
- [x] Thêm nút "Xóa Đã Chọn"
- [x] Thêm hàm `toggleSelectAll()`
- [x] Thêm hàm `deleteSelectedResults()`
- [x] Thêm API `/api/results/clear-selected`
- [x] Thêm CSS cho badge và button
- [x] Test toàn bộ tính năng
- [x] Viết tài liệu
- [ ] Deploy lên production

---

## 🎉 Kết Luận

Tính năng mới giúp:
- **Theo dõi tốt hơn**: Biết số lần check KM
- **Quản lý linh hoạt hơn**: Xóa có chọn lọc
- **UX tốt hơn**: Checkbox trực quan, dễ dùng
- **Hiệu quả hơn**: Không cần xóa thủ công trong folder
