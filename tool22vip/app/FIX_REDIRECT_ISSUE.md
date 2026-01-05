# 🔧 FIX: Script bị ngắt khi trang redirect

## ❌ Vấn đề

Khi chạy chức năng rút tiền:
1. Tool điền mật khẩu rút tiền thành công
2. Click "Xác nhận"
3. **Trang tự động redirect về trang chủ**
4. Content script bị mất → không thể tiếp tục thêm ngân hàng

## 🔍 Nguyên nhân

- Sau khi xác nhận mật khẩu, trang web redirect về home (`/`)
- Content script chỉ chạy khi inject lần đầu
- Khi redirect, script cũ bị mất, script mới không tự động chạy
- Dữ liệu (password, bankAccount, bankName) bị mất theo

## ✅ Giải pháp đã áp dụng

### 1. Lưu dữ liệu TRƯỚC KHI redirect

**Trước:**
```javascript
// Click confirm
confirmBtn.click();

// Chờ 2 giây rồi mới check redirect
setTimeout(() => {
  const checkRedirect = setInterval(() => {
    // Lúc này có thể đã redirect rồi!
  }, 500);
}, 2000);
```

**Sau:**
```javascript
// Click confirm
confirmBtn.click();

// LẬP TỨC lưu dữ liệu vào chrome.storage
chrome.storage.local.set({
  pendingBankAdd: {
    password: password,
    bankAccount: bankAccount,
    bankName: bankName,
    timestamp: Date.now()
  }
}, () => {
  // Bây giờ mới check redirect
  const checkRedirect = setInterval(() => {
    if (currentPath === '/' || currentPath === '/home') {
      // Redirect đến trang withdraw
      window.location.href = withdrawUrl;
    }
  }, 500);
});
```

**Lợi ích:**
- Dữ liệu được lưu TRƯỚC khi redirect xảy ra
- Không bị mất dữ liệu dù redirect ngay lập tức

### 2. Auto re-inject script khi navigate

**Background.js:**
```javascript
// Track tabs đang làm withdraw
const withdrawTabs = new Set();

// Listen for navigation
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (withdrawTabs.has(details.tabId)) {
    // Check if có pending bank add
    chrome.storage.local.get(['pendingBankAdd'], async (result) => {
      if (result.pendingBankAdd) {
        // Tự động re-inject script
        await chrome.scripting.executeScript({
          target: { tabId: details.tabId },
          files: ['content.js']
        });
      }
    });
  }
});
```

**Lợi ích:**
- Tự động inject lại script sau khi redirect
- Script mới sẽ đọc `pendingBankAdd` và tiếp tục thêm bank

### 3. Smart detection khi trang load

**Content.js:**
```javascript
// Check pending bank add nhiều lần
function checkPendingBankAdd() {
  chrome.storage.local.get(['pendingBankAdd'], (result) => {
    if (result.pendingBankAdd) {
      // Wait for withdraw page elements
      const waitForPageReady = setInterval(() => {
        const hasWithdrawElements = 
          document.querySelector('._addAccountInputBtn_lj38l_39') ||
          document.body.textContent.includes('Thêm Tài Khoản');

        if (hasWithdrawElements) {
          clearInterval(waitForPageReady);
          // Tiếp tục thêm bank
          clickAddBankAccount(...);
        }
      }, 500);
    }
  });
}

// Check ngay lập tức
checkPendingBankAdd();

// Check lại sau 2s và 5s (phòng trường hợp page load chậm)
setTimeout(checkPendingBankAdd, 2000);
setTimeout(checkPendingBankAdd, 5000);
```

**Lợi ích:**
- Đảm bảo script chạy dù trang load chậm
- Chờ đúng elements xuất hiện trước khi thao tác

### 4. Tăng timeout

- `pendingBankAdd` timeout: 30s → **60s**
- Đủ thời gian cho redirect + page load + re-inject

## 📊 Flow hoàn chỉnh

```
1. User click "Rút tiền"
   ↓
2. Tool điền mật khẩu rút tiền
   ↓
3. Click "Xác nhận"
   ↓
4. 💾 LẬP TỨC lưu dữ liệu vào chrome.storage
   ↓
5. 🔄 Trang redirect về home (/)
   ↓
6. 🎯 Background detect navigation → re-inject script
   ↓
7. 📄 Script mới load → đọc pendingBankAdd
   ↓
8. 🚀 Navigate đến /home/withdraw?active=10
   ↓
9. ⏳ Chờ trang withdraw load
   ↓
10. 🏦 Tự động click "Thêm Tài Khoản" và điền thông tin
    ↓
11. ✅ Hoàn thành!
```

## 🧪 Test

1. Chọn 1 trang chưa có mật khẩu rút tiền
2. Chạy tool rút tiền
3. Quan sát console:
   - `💾 Saving bank data BEFORE redirect...`
   - `✅ Redirected to home! Navigating to withdraw page...`
   - `🔄 Navigation completed, checking for pending bank add...`
   - `💾 Found pending bank add, re-injecting script...`
   - `🏦 Auto-adding bank after password setup...`
4. Tool sẽ tự động thêm ngân hàng sau khi redirect

## 📝 Lưu ý

- Dữ liệu trong `pendingBankAdd` tự động xóa sau 60 giây
- Nếu tab bị đóng, dữ liệu vẫn được giữ (có thể mở lại)
- Background service worker phải đang chạy (keep-alive đã bật)
