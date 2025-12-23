# 🔧 VIP Category Display Fix

**Status**: ✅ COMPLETED

**Date**: 2025-12-21

**File**: `dashboard/server.js`

---

## 🐛 Vấn Đề

Kết quả 78win đang hiển thị category sai - hiển thị "okvip" thay vì "78win".

**Nguyên nhân**: Endpoint `/api/automation/results` không gửi `category` field trong result object. Frontend mặc định category là "okvip" nếu không có giá trị.

---

## ✅ Giải Pháp

### 1. Thêm Logic Lấy Category từ Account Info (Line 1050)

**Trước**: Chỉ kiểm tra Nohu account
**Sau**: Kiểm tra VIP categories (okvip, abcvip, jun88, 78win, jun88v2, kjc) trước, sau đó mới kiểm tra Nohu

```javascript
let hasAccountInfo = false;
let category = 'okvip'; // Default category

// Check if account exists in any date folder (for VIP categories)
const vipCategoriesDir = path.join(__dirname, '../accounts/vip');
if (fs.existsSync(vipCategoriesDir)) {
    const vipCategories = ['okvip', 'abcvip', 'jun88', '78win', 'jun88v2', 'kjc'];
    for (const cat of vipCategories) {
        const catDir = path.join(vipCategoriesDir, cat);
        if (fs.existsSync(catDir)) {
            const dateFolders = fs.readdirSync(catDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name);

            for (const dateFolder of dateFolders) {
                const userAccountDir = path.join(catDir, dateFolder, username);
                if (fs.existsSync(userAccountDir)) {
                    const files = fs.readdirSync(userAccountDir);
                    if (files.some(f => f === `${cat}.json` || f === `${cat}.txt`)) {
                        category = cat; // Found category
                        hasAccountInfo = true;
                        break;
                    }
                }
            }
            if (hasAccountInfo) break;
        }
    }
}

// Check if account exists in Nohu folder (for backward compatibility)
if (!hasAccountInfo) {
    const accountsDir = path.join(__dirname, '../accounts/nohu');
    if (fs.existsSync(accountsDir)) {
        const dateFolders = fs.readdirSync(accountsDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name);

        for (const dateFolder of dateFolders) {
            const userAccountDir = path.join(accountsDir, dateFolder, username);
            if (fs.existsSync(userAccountDir)) {
                const files = fs.readdirSync(userAccountDir);
                if (files.some(f => f === 'account.json' || f === 'account.txt')) {
                    hasAccountInfo = true;
                    break;
                }
            }
        }
    }
}
```

---

### 2. Thêm Category vào Result Object (Line 1120)

**Trước**: Không có `category` field
**Sau**: Thêm `category: category` vào result object

```javascript
results.push({
    profileName: profileName,
    username: username,
    sessionId: sessionId,
    runNumber: runNumber,
    toolId: sessionToolId,
    category: category, // 🔥 Add category
    siteName: siteName,
    timestamp: stats.mtimeMs,
    status: 'success',
    screenshot: screenshotPath,
    hasAccountInfo: hasAccountInfo
});
```

---

### 3. Thêm Category vào Old Structure Result (Line 1188)

**Trước**: Không có `category` field
**Sau**: Thêm `category: category` vào result object

```javascript
results.push({
    profileName: 'Profile',
    username: username,
    sessionId: null,
    toolId: guessedToolId,
    category: category, // 🔥 Add category
    siteName: siteName,
    timestamp: stats.mtimeMs,
    status: 'success',
    screenshot: screenshotPath,
    hasAccountInfo: hasAccountInfo
});
```

---

## 📊 Flow

```
API Request: /api/automation/results?tool=vip-tool
    ↓
Scan screenshots folder
    ↓
Lấy category từ account info:
  - Kiểm tra VIP categories (okvip, abcvip, jun88, 78win, jun88v2, kjc)
  - Nếu không tìm thấy, kiểm tra Nohu
  - Nếu vẫn không tìm thấy, mặc định là 'okvip'
    ↓
Thêm category vào result object
    ↓
Gửi result với category field
    ↓
Frontend nhận category từ API
    ↓
Hiển thị category đúng trong table
```

---

## 🛡️ Lợi Ích

✅ **Hiển thị category đúng** - 78win sẽ hiển thị "78win", không phải "okvip"

✅ **Hỗ trợ tất cả VIP categories** - okvip, abcvip, jun88, 78win, jun88v2, kjc

✅ **Backward compatible** - Vẫn hỗ trợ Nohu accounts

✅ **Mặc định hợp lý** - Nếu không tìm thấy category, mặc định là 'okvip'

---

## 🧪 Test

Chạy VIP automation cho 78win và kiểm tra:
1. ✅ Kết quả hiển thị category "78win" (không phải "okvip")
2. ✅ Kết quả hiển thị đúng cho các category khác (okvip, abcvip, jun88, etc.)
3. ✅ Nút "Xem thông tin tài khoản" truyền category đúng

---

## 📝 Ghi Chú

- Category được lấy từ account info (file `{category}.json` hoặc `{category}.txt`)
- Nếu không tìm thấy account info, mặc định là 'okvip'
- Hỗ trợ cả new structure (screenshots/toolId/username/session/) và old structure (screenshots/username/session/)
- Category được gửi trong API response `/api/automation/results`
- Frontend sử dụng category từ API để hiển thị đúng

---

**Status**: ✅ READY FOR TESTING
