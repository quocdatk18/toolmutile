# Test API Key Validation - UI

## Mục đích
Kiểm tra validation API key hoạt động đúng trước khi chạy automation.

## Test Cases

### Test 1: Không có API Key
**Bước thực hiện:**
1. Mở Dashboard
2. Xóa API Key (nếu có): Sidebar → API Key → Xóa hết
3. Chọn tool NOHU
4. Chọn profile
5. Chọn trang (Go99, NOHU, etc.)
6. Điền thông tin tài khoản
7. Click "CHẠY TỰ ĐỘNG"

**Kết quả mong đợi:**
- ❌ Hiển thị toast error: "Thiếu API Key"
- ⚠️ Thông báo: "Vui lòng thêm Captcha API Key ở sidebar bên trái trước khi chạy automation!"
- 📝 Hướng dẫn: "Lấy API key tại: autocaptcha.pro"
- ⛔ Automation KHÔNG chạy

---

### Test 2: API Key quá ngắn
**Bước thực hiện:**
1. Sidebar → API Key → Nhập: `abc123`
2. Click "Lưu"

**Kết quả mong đợi:**
- ❌ Hiển thị toast error: "API Key không hợp lệ"
- 📝 Chi tiết: "API key quá ngắn (tối thiểu 10 ký tự)"
- ⛔ KHÔNG lưu được

---

### Test 3: API Key có ký tự không hợp lệ
**Bước thực hiện:**
1. Sidebar → API Key → Nhập: `api@key#123456`
2. Click "Lưu"

**Kết quả mong đợi:**
- ❌ Hiển thị toast error: "API Key không hợp lệ"
- 📝 Chi tiết: "API key chứa ký tự không hợp lệ (chỉ chấp nhận a-z, A-Z, 0-9, -, _)"
- ⛔ KHÔNG lưu được

---

### Test 4: API Key có khoảng trắng
**Bước thực hiện:**
1. Sidebar → API Key → Nhập: `api key 1234567890`
2. Click "Lưu"

**Kết quả mong đợi:**
- ❌ Hiển thị toast error: "API Key không hợp lệ"
- 📝 Chi tiết: "API key chứa ký tự không hợp lệ"
- ⛔ KHÔNG lưu được

---

### Test 5: API Key hợp lệ nhưng sai (không tồn tại)
**Bước thực hiện:**
1. Sidebar → API Key → Nhập: `abcdefghij1234567890` (format đúng nhưng key không tồn tại)
2. Click "Lưu"
3. Click "Kiểm Tra"

**Kết quả mong đợi:**
- ✅ Lưu thành công (format đúng)
- ⏳ Hiển thị "Đang kiểm tra..."
- ❌ Sau đó hiển thị: "API Key không hợp lệ" (từ server)
- 🔴 Badge chuyển sang: "❌ API Key Invalid"

---

### Test 6: API Key hợp lệ và đúng
**Bước thực hiện:**
1. Sidebar → API Key → Nhập API key thật từ autocaptcha.pro
2. Click "Lưu"
3. Click "Kiểm Tra"

**Kết quả mong đợi:**
- ✅ Lưu thành công
- ⏳ Hiển thị "Đang kiểm tra..."
- ✅ Hiển thị: "API Key hợp lệ - Số dư: XXX VNĐ"
- 🟢 Badge chuyển sang: "✅ API Key Active"
- 💰 Hiển thị số dư trong panel

---

### Test 7: Chạy automation với API Key hợp lệ
**Bước thực hiện:**
1. Đảm bảo đã có API Key hợp lệ (Test 6)
2. Chọn tool NOHU
3. Chọn profile
4. Chọn trang
5. Điền thông tin
6. Click "CHẠY TỰ ĐỘNG"

**Kết quả mong đợi:**
- ✅ Console log: "API Key validated: abcdefgh..."
- ✅ Toast: "Automation đang chạy..."
- 🚀 Automation chạy bình thường

---

### Test 8: Chạy Đăng Ký không có API Key
**Bước thực hiện:**
1. Xóa API Key
2. Tab "Đăng Ký"
3. Điền thông tin
4. Click "Đăng Ký"

**Kết quả mong đợi:**
- ❌ Toast error: "Thiếu API Key"
- ⚠️ "Vui lòng thêm Captcha API Key ở sidebar trước khi đăng ký!"
- ⛔ KHÔNG chạy

---

### Test 9: Chạy Đăng Nhập không có API Key
**Bước thực hiện:**
1. Xóa API Key
2. Tab "Đăng Nhập"
3. Điền username/password
4. Click "Đăng Nhập"

**Kết quả mong đợi:**
- ❌ Toast error: "Thiếu API Key"
- ⚠️ "Vui lòng thêm Captcha API Key ở sidebar trước khi đăng nhập!"
- ⛔ KHÔNG chạy

---

### Test 10: Check Khuyến Mãi không có API Key
**Bước thực hiện:**
1. Xóa API Key
2. Tab "Check KM"
3. Nhập username
4. Click "Check Khuyến Mãi"

**Kết quả mong đợi:**
- ❌ Toast error: "Thiếu API Key"
- ⚠️ "Vui lòng thêm Captcha API Key ở sidebar trước khi check khuyến mãi!"
- ⛔ KHÔNG chạy

---

### Test 11: API Key với số dư thấp
**Bước thực hiện:**
1. Nhập API Key có số dư < $1
2. Click "Kiểm Tra"

**Kết quả mong đợi:**
- ✅ API Key hợp lệ
- ⚠️ Toast warning: "Số dư thấp - Số dư: $0.XX VNĐ. Vui lòng nạp thêm!"
- 💡 Vẫn cho phép chạy automation (không block)

---

## Checklist Tổng Hợp

### Validation Format (Client-side)
- [ ] Kiểm tra API key không rỗng
- [ ] Kiểm tra độ dài tối thiểu 10 ký tự
- [ ] Kiểm tra chỉ chứa: a-z, A-Z, 0-9, -, _
- [ ] Hiển thị lỗi cụ thể cho từng trường hợp

### Validation Balance (Server-side)
- [ ] Gọi API autocaptcha.pro
- [ ] Hiển thị số dư
- [ ] Cảnh báo nếu số dư < $1
- [ ] Cập nhật badge trạng thái

### Validation trước Automation
- [ ] Tự động (Full sequence)
- [ ] Đăng ký
- [ ] Đăng nhập
- [ ] Check khuyến mãi
- [ ] Thêm bank (không cần API key)

### UI/UX
- [ ] Toast hiển thị đủ lâu (8 giây)
- [ ] Thông báo rõ ràng, dễ hiểu
- [ ] Có icon phù hợp (⚠️, ❌, ✅)
- [ ] Có hướng dẫn lấy API key
- [ ] Console log để debug

---

## Lỗi thường gặp

### Lỗi 1: Validation không chạy
**Nguyên nhân:** File dashboard.js hoặc nohu-tool.html chưa được load
**Giải pháp:** Hard refresh (Ctrl+Shift+R)

### Lỗi 2: API Key lưu được nhưng không validate
**Nguyên nhân:** Hàm validateApiKeyFormat() chưa được định nghĩa
**Giải pháp:** Kiểm tra console, reload page

### Lỗi 3: Toast không hiển thị
**Nguyên nhân:** Hàm showToast() bị lỗi
**Giải pháp:** Kiểm tra console errors

### Lỗi 4: Automation vẫn chạy dù không có API key
**Nguyên nhân:** Backend không validate hoặc API key được load từ config cũ
**Giải pháp:** 
- Xóa localStorage: `localStorage.clear()`
- Xóa API key trong config/settings.json
- Restart dashboard

---

## Debug Commands

### Kiểm tra API key trong localStorage:
```javascript
console.log('API Key:', localStorage.getItem('hidemium_global_api_key'));
```

### Xóa API key:
```javascript
localStorage.removeItem('hidemium_global_api_key');
```

### Test validation function:
```javascript
validateApiKeyFormat('test123'); // Should fail (too short)
validateApiKeyFormat('test@123456789'); // Should fail (invalid chars)
validateApiKeyFormat('test1234567890'); // Should pass
```

### Kiểm tra apiKeyManager:
```javascript
console.log('Has key:', apiKeyManager.getInfo().hasKey);
console.log('Key:', apiKeyManager.get());
```

---

## Kết luận

Sau khi pass tất cả test cases trên, validation API key đã hoạt động đúng và đảm bảo:
- ✅ Không thể chạy automation nếu không có API key
- ✅ Không thể lưu API key không hợp lệ
- ✅ Hiển thị lỗi rõ ràng cho user
- ✅ Hướng dẫn user cách lấy API key
- ✅ Cảnh báo khi số dư thấp
