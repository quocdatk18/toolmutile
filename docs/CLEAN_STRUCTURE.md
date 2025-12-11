# 🎯 Clean Structure - Final Version

## ✅ Cấu Trúc Cuối Cùng (Đơn Giản & Hợp Lý)

### 📍 Layout

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER                               │
│  🎛️ Hidemium Multi-Tool Dashboard                      │
│  ✅ Hidemium Connected | 🔑 API Key Active             │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────────┐
│   SIDEBAR    │         MAIN CONTENT                     │
│              │                                          │
│ 🔑 API Key   │  🎯 Available Tools                      │
│   Manager    │  ┌────────┐ ┌────────┐ ┌────────┐      │
│              │  │📋 Prof │ │🎰 NOHU │ │➕ Add  │      │
│ [Input Key]  │  │ Mgmt   │ │ Tool   │ │ Tool   │      │
│ [💾][💰]    │  └────────┘ └────────┘ └────────┘      │
│              │                                          │
│ Status: ✅   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Balance: 0   │                                          │
│              │  📋 Profile Management                   │
│              │  [➕ Tạo] [🔄 Tải Lại]                  │
│              │  [▶️ Start] [⏹️ Stop] [🗑️ Xóa]         │
│              │  ┌────────┐ ┌────────┐ ┌────────┐      │
│              │  │☑️ PR1  │ │☐ PR2   │ │☑️ PR3  │      │
│              │  └────────┘ └────────┘ └────────┘      │
│              │                                          │
│              │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│              │                                          │
│              │  🎰 NOHU Auto Tool                       │
│              │  ┌──────────────────────────────────┐   │
│              │  │ 📋 Chọn Profile                  │   │
│              │  │ [Select Dropdown] [🔄]           │   │
│              │  │ ✅ admin1 (Win | Chrome | IP)    │   │
│              │  └──────────────────────────────────┘   │
│              │  [Tabs: Tự Động | Đăng Ký | Login...]   │
│              │  [Form fields...]                        │
│              │  [🚀 Chạy Automation]                   │
└──────────────┴──────────────────────────────────────────┘
```

---

## 🗂️ Sections

### 1. **Sidebar** - Chỉ API Key

**Mục đích:** Quản lý API Key (shared resource duy nhất)

**Bao gồm:**
- ✅ Input API Key
- ✅ Lưu & Kiểm tra số dư
- ✅ Hiển thị trạng thái & balance

**Không bao gồm:**
- ❌ Profile list (đã chuyển vào tool forms)

**Lý do:**
- API Key là resource thật sự shared (dùng chung cho tất cả tools)
- Profiles thì mỗi lần chạy tool chọn 1 profile → Nên đặt trong form tool

### 2. **Main Content - Tools Grid** (Default)

**Hiển thị:**
- 📋 **Profile Management** - System tool
- 🎰 **NOHU Auto Tool** - Automation tool
- ➕ **Add New Tool** - Placeholder

### 3. **Profile Management Section**

**Mục đích:** Quản lý Hidemium profiles (tạo, xóa, start/stop)

**Tính năng:**
- ✅ Tạo profiles mới
- ✅ Xem danh sách profiles
- ✅ Start/Stop profiles
- ✅ Xóa profiles
- ✅ Bulk operations

**Không có:**
- ❌ Profile selector (đã chuyển vào tool forms)

### 4. **Tool UI Section** (Ví dụ: NOHU Tool)

**Mỗi tab có:**
- ✅ **Profile Selector** (dropdown) - Chọn profile để chạy
- ✅ Form fields (username, password, bank, etc.)
- ✅ Action button (Chạy automation)

**Tabs:**
- 🤖 Tự Động
- 📝 Đăng Ký
- 🔐 Đăng Nhập
- 💳 Thêm Bank
- 🎁 Check KM

---

## 🔄 Workflow

### Quản Lý Profiles

```
1. Dashboard → Click "📋 Profile Management"
2. Profile Management Section loads
3. Tạo/Xóa/Start/Stop profiles
4. Bulk operations (chọn nhiều profiles)
```

### Chạy Automation

```
1. Dashboard → Click "🎰 NOHU Auto Tool"
2. Tool UI loads
3. Chọn tab (Tự Động, Đăng Ký, etc.)
4. **Chọn profile từ dropdown** ← QUAN TRỌNG
5. Fill form (username, password, etc.)
6. Click "Chạy"
7. Tool chạy automation trên profile đã chọn
```

---

## 🎯 Key Changes

### ✅ Profile Selector trong Tool Forms

**Trước:**
- Profiles list ở sidebar
- User phải chọn profile từ sidebar trước
- Rồi mới vào tool để chạy

**Sau:**
- Profile selector **trong mỗi tab của tool**
- User chọn profile ngay tại form
- Trực quan và hợp lý hơn

**Lý do:**
- Mỗi lần chạy automation chỉ cần 1 profile
- Profile selector nên nằm cùng form (nơi user điền thông tin)
- Giống như chọn "Tài khoản" trước khi đăng nhập

### ✅ Sidebar Chỉ Có API Key

**Lý do:**
- API Key là resource thật sự shared (tất cả tools dùng chung)
- Profiles thì mỗi tool/action chọn 1 profile riêng
- Sidebar gọn gàng, không rối

---

## 📋 Profile Selector Features

### Dropdown Select

```html
<select id="autoProfileSelect">
  <option value="">-- Chọn profile --</option>
  <option value="uuid1">● admin1 (Win | Chrome | 123.45.67.89)</option>
  <option value="uuid2">admin2 (Mac | Firefox | No proxy)</option>
  <option value="uuid3">● admin3 (Win | Chrome | 98.76.54.32)</option>
</select>
```

**Hiển thị:**
- ● Running indicator
- Profile name
- OS | Browser | Proxy IP

### Selected Profile Info

Khi chọn profile, hiển thị badge:

```
┌──────────────────────────────────────┐
│ ✅ admin1                            │
│ Windows | Chrome | 🌍 123.45.67.89  │
└──────────────────────────────────────┘
```

### Auto-load

- Profiles được load tự động khi tool UI loads
- Có nút 🔄 để reload profiles
- Sync với ProfileManager (shared)

---

## 🎨 UI Components

### Sidebar (Minimal)

```
┌─────────────────────────┐
│ 🔑 API Key Manager      │
│                         │
│ [Input API Key]         │
│ [💾 Lưu] [💰 Check]    │
│                         │
│ Trạng thái: ✅ Active   │
│ Số dư: 10,000 VNĐ       │
└─────────────────────────┘
```

### Tool Form (Mỗi Tab)

```
┌──────────────────────────────────────┐
│ 📋 Chọn Profile                      │
│ [Select Dropdown ▼] [🔄]            │
│ ✅ admin1 (Win | Chrome | IP)        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 👤 Thông Tin Tài Khoản              │
│ [Username] [Password]                │
└──────────────────────────────────────┘

[🚀 Chạy Automation]
```

---

## 📁 Code Structure

### Tool HTML (nohu-tool.html)

```javascript
// Load profiles into select dropdowns
async function loadProfilesForSelect() {
    const profiles = await profileManager.loadAll();
    
    // Populate all selects
    ['auto', 'reg', 'login', 'bank', 'promo'].forEach(tab => {
        const select = document.getElementById(`${tab}ProfileSelect`);
        // Add options...
    });
}

// Handle profile selection
function onProfileSelected(tabPrefix) {
    const select = document.getElementById(`${tabPrefix}ProfileSelect`);
    const uuid = select.value;
    
    // Select in manager
    profileManager.select(uuid);
    
    // Show selected profile info
    // ...
}
```

### Dashboard JS

```javascript
// Sidebar - Only API Key management
// No profile list functions

// Profile Management Section
function openProfileManagement() {
    // Show profile management section
    // Load profiles with bulk operations
}
```

---

## ✅ Benefits

1. **Đơn giản hơn**
   - Sidebar chỉ có API Key
   - Profile selector nằm trong form (hợp lý)

2. **Trực quan hơn**
   - User chọn profile ngay tại nơi cần dùng
   - Không cần nhớ "chọn profile trước"

3. **Linh hoạt hơn**
   - Mỗi tab có thể chọn profile khác nhau
   - Dễ switch profile giữa các lần chạy

4. **Consistent**
   - Giống pattern: Chọn tài khoản → Điền form → Submit
   - User-friendly

---

## 🚀 Summary

**Sidebar:**
- Chỉ có API Key Manager

**Profile Management:**
- Section riêng (system tool)
- Quản lý profiles: tạo, xóa, start/stop, bulk operations

**Tool Forms:**
- Mỗi tab có Profile Selector (dropdown)
- User chọn profile → Fill form → Chạy
- Đơn giản, trực quan, hợp lý

---

**Version:** 4.0.0 - Clean & Simple  
**Date:** December 2024  
**Status:** ✅ Final & Clean
