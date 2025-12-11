# 🧪 Testing Guide - Hidemium Multi-Tool Dashboard

## 📋 Checklist Testing

### Phase 1: Installation ✅

```bash
cd hidemium-multi-tool
npm install
```

**Expected:** Dependencies installed successfully

---

### Phase 2: Start Dashboard ✅

```bash
npm run dashboard
# hoặc
START_DASHBOARD.bat
```

**Expected:**
- Server starts on port 3000
- No errors in console
- Message: "Server running at: http://localhost:3000"

---

### Phase 3: Open Dashboard ✅

Mở browser: http://localhost:3000

**Expected:**
- Dashboard loads successfully
- Header hiển thị đúng
- Sidebar hiển thị đúng
- Tools grid hiển thị đúng

---

### Phase 4: Test Hidemium Connection

**Steps:**
1. Mở Hidemium Browser
2. Settings → Local API → Enable
3. Refresh dashboard

**Expected:**
- Status badge: "✅ Hidemium Connected"
- Màu xanh

---

### Phase 5: Test API Key Manager

**Steps:**
1. Sidebar → API Key Manager
2. Nhập API Key test
3. Click "Lưu"
4. Click "Kiểm Tra"

**Expected:**
- Toast: "Đã lưu"
- Status badge: "🔑 API Key Active"
- Balance hiển thị (nếu key đúng)

---

### Phase 6: Test Profile Manager

**Steps:**
1. Sidebar → Profile Manager
2. Click "Tải Profiles"

**Expected:**
- Profiles load từ Hidemium
- Hiển thị danh sách profiles
- Toast: "Đã tải profiles"

---

### Phase 7: Test Create Profile

**Steps:**
1. Click "Tạo Profile Mới"
2. Nhập tên: "Test Profile"
3. Chọn OS: Windows
4. Chọn Browser: Chrome
5. Click "Tạo Profile"

**Expected:**
- Modal đóng
- Toast: "Tạo thành công"
- Profile mới xuất hiện trong list

---

### Phase 8: Test Profile Actions

**Steps:**
1. Click profile để select
2. Click "▶️ Start"
3. Đợi profile start
4. Click "⏹️ Stop"

**Expected:**
- Profile được select (highlight)
- Start thành công
- Status dot màu xanh
- Stop thành công

---

### Phase 9: Test NOHU Tool

**Steps:**
1. Click vào "NOHU Auto Tool" card
2. Tool UI loads

**Expected:**
- Tool content hiển thị
- 5 tabs hiển thị
- Sites grid hiển thị (7 sites)
- Form inputs hiển thị

---

### Phase 10: Test NOHU Tool Features

#### Test Sites Selection
**Steps:**
1. Click "✅ Chọn Tất Cả"
2. Click "❌ Bỏ Chọn"

**Expected:**
- Tất cả sites được chọn
- Tất cả sites bỏ chọn

#### Test Random Username
**Steps:**
1. Click 🎲 button

**Expected:**
- Username random được generate
- Fill vào input

#### Test Bank Loading
**Steps:**
1. Mở dropdown ngân hàng

**Expected:**
- Danh sách banks load từ VietQR
- Sorted alphabetically

#### Test Tabs
**Steps:**
1. Click từng tab

**Expected:**
- Tab content switch đúng
- Active state đúng

---

### Phase 11: Test Back Navigation

**Steps:**
1. Click "← Quay lại Tools"

**Expected:**
- Tool content ẩn
- Tools grid hiển thị lại

---

## 🐛 Common Issues & Solutions

### Issue 1: Dashboard không start

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
npm install
```

---

### Issue 2: Hidemium không connect

**Error:** "Hidemium Offline"

**Solution:**
1. Mở Hidemium
2. Settings → Local API → Enable
3. Restart Hidemium
4. Refresh dashboard

---

### Issue 3: Profiles không load

**Error:** "Lỗi tải profiles"

**Solution:**
1. Check Hidemium đang chạy
2. Check Local API enabled
3. Check port 3000 không bị conflict

---

### Issue 4: API Key không save

**Error:** "Không thể lưu API Key"

**Solution:**
1. Check browser localStorage enabled
2. Check không ở incognito mode
3. Clear browser cache

---

### Issue 5: NOHU Tool UI không load

**Error:** "Lỗi tải UI tool"

**Solution:**
1. Check file `dashboard/tools-ui/nohu-tool.html` exists
2. Check path trong `config/tools.json` đúng
3. Restart server

---

## ✅ Testing Checklist

- [ ] Installation successful
- [ ] Dashboard starts
- [ ] Dashboard loads in browser
- [ ] Hidemium connection works
- [ ] API Key Manager works
- [ ] Profile Manager works
- [ ] Create Profile works
- [ ] Profile actions work (start/stop)
- [ ] NOHU Tool loads
- [ ] Sites selection works
- [ ] Random username works
- [ ] Bank loading works
- [ ] Tabs switching works
- [ ] Back navigation works
- [ ] Toast notifications work
- [ ] Modal works
- [ ] No console errors

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

✅ Installation: PASS / FAIL
✅ Dashboard Start: PASS / FAIL
✅ Dashboard Load: PASS / FAIL
✅ Hidemium Connection: PASS / FAIL
✅ API Key Manager: PASS / FAIL
✅ Profile Manager: PASS / FAIL
✅ Create Profile: PASS / FAIL
✅ Profile Actions: PASS / FAIL
✅ NOHU Tool: PASS / FAIL
✅ Tool Features: PASS / FAIL

Overall: PASS / FAIL

Notes:
_______________________________
_______________________________
```

---

## 🎯 Success Criteria

Dashboard được coi là **PASS** nếu:

1. ✅ Tất cả features hoạt động
2. ✅ Không có errors trong console
3. ✅ UI/UX mượt mà
4. ✅ Toast notifications hoạt động
5. ✅ Hidemium connection stable

---

**Ready to test! 🚀**
