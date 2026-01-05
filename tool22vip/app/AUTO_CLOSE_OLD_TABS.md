# 🗑️ TỰ ĐỘNG ĐÓNG TAB CŨ

## 🎯 Tính năng

Khi chạy chức năng mới, tự động đóng các tab cũ của chức năng trước để giảm số lượng tab.

## ✅ Cách hoạt động

### 1. Track tabs cho mỗi chức năng
```javascript
const registerTabs = new Set();
const loginTabs = new Set();
const withdrawTabs = new Set();
const promotionTabs = new Set();
const phoneVerifyTabs = new Set();
```

### 2. Đóng tab cũ trước khi mở tab mới
```javascript
async function handleMultiAutoRegister(data) {
  // Close old register tabs first
  if (registerTabs.size > 0) {
    console.log(`🗑️ Closing ${registerTabs.size} old register tabs...`);
    await closeOldTabs(registerTabs, []);
  }
  
  // Create new tabs
  const tabs = await createTabs(urls);
  
  // Track new tabs
  tabs.forEach(tab => registerTabs.add(tab.id));
}
```

### 3. Helper function
```javascript
async function closeOldTabs(tabSet, newTabs) {
  // Close all old tabs
  for (const tabId of tabSet) {
    try {
      await chrome.tabs.remove(tabId);
      console.log(`✅ Closed tab ${tabId}`);
    } catch (error) {
      console.log(`⚠️ Tab ${tabId} already closed`);
    }
  }
  
  // Clear old set and add new tabs
  tabSet.clear();
  newTabs.forEach(tabId => tabSet.add(tabId));
}
```

## 📊 Flow

```
User chạy Đăng Ký:
  → Mở 5 tabs đăng ký
  → registerTabs = [1, 2, 3, 4, 5]

User chạy Đăng Nhập:
  → Đóng 5 tabs đăng ký cũ (1, 2, 3, 4, 5)
  → Mở 3 tabs đăng nhập mới
  → loginTabs = [6, 7, 8]
  → registerTabs = []

User chạy Rút Tiền:
  → Đóng 3 tabs đăng nhập cũ (6, 7, 8)
  → Mở 2 tabs rút tiền mới
  → withdrawTabs = [9, 10]
  → loginTabs = []
```

## 🎯 Lợi ích

1. ✅ **Giảm số lượng tab:** Không bị quá nhiều tab mở cùng lúc
2. ✅ **Tiết kiệm RAM:** Đóng tab cũ giải phóng bộ nhớ
3. ✅ **Dễ quản lý:** Chỉ giữ tab của chức năng hiện tại
4. ✅ **Tự động:** Không cần đóng tab thủ công

## 📝 Console Logs

```
🚀 Starting multi-register with 5 URLs
🗑️ Closing 0 old register tabs...
⚡ Creating ALL tabs RIGHT NOW...
✅ Tab 123 opened
✅ Tab 124 opened
...

🔐 Starting multi-login with 3 URLs
🗑️ Closing 5 old register tabs...
✅ Closed tab 123
✅ Closed tab 124
...
⚡ Creating ALL tabs RIGHT NOW...
✅ Tab 130 opened
...
```

## ⚙️ Áp dụng cho tất cả chức năng

- ✅ Đăng Ký (registerTabs)
- ✅ Đăng Nhập (loginTabs)
- ✅ Rút Tiền (withdrawTabs)
- ✅ Khuyến Mãi (promotionTabs)
- ✅ Xác Thực SĐT (phoneVerifyTabs)

## 🔧 Code changes

### handleMultiAutoRegister
```javascript
// Close old register tabs first
if (registerTabs.size > 0) {
  await closeOldTabs(registerTabs, []);
}

// Track new tabs
createdTabs.forEach(({ tab }) => registerTabs.add(tab.id));
```

### handleMultiLogin
```javascript
// Close old login tabs first
if (loginTabs.size > 0) {
  await closeOldTabs(loginTabs, []);
}

// Track new tabs
createdTabs.forEach(({ tab }) => loginTabs.add(tab.id));
```

### handleMultiWithdraw
```javascript
// Close old withdraw tabs first
if (withdrawTabs.size > 0) {
  await closeOldTabs(withdrawTabs, []);
}

// Already tracking tabs (withdrawTabs.add)
```

### handleMultiPromotionNoPhoneVerify
```javascript
// Close old promotion tabs first
if (promotionTabs.size > 0) {
  await closeOldTabs(promotionTabs, []);
}

// Track new tabs
createdTabs.forEach(({ tab }) => promotionTabs.add(tab.id));
```

### handleMultiPhoneVerify
```javascript
// Close old phone verify tabs first
if (phoneVerifyTabs.size > 0) {
  await closeOldTabs(phoneVerifyTabs, []);
}

// Track new tabs
createdTabs.forEach(({ tab }) => phoneVerifyTabs.add(tab.id));
```

## 🧪 Test

1. Reload extension
2. Chạy Đăng Ký → Mở 5 tabs
3. Chạy Đăng Nhập → 5 tabs cũ đóng, 3 tabs mới mở
4. Chạy Rút Tiền → 3 tabs cũ đóng, 2 tabs mới mở
5. Xem console: Sẽ thấy log "🗑️ Closing X old tabs..."

## 📌 Lưu ý

- Tab sẽ đóng TRƯỚC KHI mở tab mới
- Nếu tab đã đóng thủ công, sẽ bỏ qua (không lỗi)
- Mỗi chức năng có Set riêng, không ảnh hưởng lẫn nhau

**Reload extension và test thử!** 🚀
