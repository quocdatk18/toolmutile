# 🔧 FIX: Tìm đúng button "Thêm Tài Khoản"

## ❌ Vấn đề

Tool timeout khi tìm form, không click được button "Thêm Tài Khoản" vì:
1. Tìm bằng class cụ thể `._addAccountInputBtn_lj38l_39` (có thể thay đổi)
2. Logic chỉ chờ form password, không xử lý trường hợp đã có mật khẩu

## ✅ Giải pháp

### 1. Tìm button bằng TEXT thay vì class

**Trước:**
```javascript
// Chỉ tìm bằng class cụ thể
const addAccountBtn = document.querySelector('._addAccountInputBtn_lj38l_39');
```

**Sau:**
```javascript
// Method 1: Try by class first (fast)
let addAccountBtn = document.querySelector('._addAccountInputBtn_lj38l_39');

// Method 2: If not found, search by text (more reliable)
if (!addAccountBtn) {
  const allElements = document.querySelectorAll('button, div, span, a');
  
  for (let el of allElements) {
    const text = el.textContent.trim();
    
    if (text === 'Thêm Tài Khoản' || text === 'Thêm tài khoản') {
      if (el.offsetParent !== null) {
        addAccountBtn = el;
        break;
      }
    }
  }
}
```

**Lợi ích:**
- Không phụ thuộc vào class (có thể thay đổi)
- Tìm được button dù HTML structure thay đổi
- Fallback 2 lớp: class → text

### 2. Smart page detection

**Trước:**
```javascript
// Chỉ chờ form password
const checkFormLoaded = setInterval(() => {
  const passwordInputs = document.querySelectorAll('.ui-password-input__item');
  
  if (passwordInputs.length >= 6) {
    // Fill password
  }
}, 500);
```

**Sau:**
```javascript
// Check nhiều trạng thái
const checkPageState = setInterval(() => {
  const pageText = document.body.textContent;
  const hasWithdrawElements =
    document.querySelector('.ui-password-input__item') || // Password form
    document.querySelector('._addAccountInputBtn_lj38l_39') || // Add button
    pageText.includes('Thêm Tài Khoản') ||
    pageText.includes('Quản Lý Rút Tiền');

  if (hasWithdrawElements) {
    // Use smart detection
    checkAndFillWithdrawPassword(...);
  }
}, 500);
```

**Lợi ích:**
- Detect được cả 2 trạng thái: chưa có password + đã có password
- Gọi đúng function tùy trạng thái

### 3. Improved state detection

Function `checkAndFillWithdrawPassword` đã có logic phân biệt:

```javascript
// State 1: Password setup page (has 6+ input boxes)
if (hasPasswordSetup && passwordInputs.length >= 6) {
  fillWithdrawPassword(...);
}

// State 2: Password already set (has "Thêm Tài Khoản" button)
if (hasAddAccountButton && passwordInputs.length < 6) {
  clickAddBankAccount(...);
}
```

## 📊 Flow mới

```
1. Tool mở trang withdraw
   ↓
2. Check page state (multiple attempts)
   ↓
3. Detect trạng thái:
   
   A. Chưa có password?
      → fillWithdrawPassword()
      → Click confirm
      → Redirect về home
      → Navigate to withdraw
      → clickAddBankAccount()
   
   B. Đã có password?
      → clickAddBankAccount() (ngay lập tức)
      → Tìm button bằng text
      → Click "Thêm Tài Khoản"
      → Click "Tài khoản ngân hàng"
      → Nhập password
      → Điền thông tin bank
```

## 🧪 Test

1. Reload extension
2. Test với trang **chưa có mật khẩu**:
   - Tool sẽ điền password
   - Redirect về home
   - Navigate to withdraw
   - Tự động thêm bank
   
3. Test với trang **đã có mật khẩu**:
   - Tool sẽ bỏ qua bước password
   - Tìm button "Thêm Tài Khoản" bằng text
   - Click và thêm bank ngay

## 📝 Lưu ý

- Button "Thêm Tài Khoản" phải visible (offsetParent !== null)
- Nếu không tìm thấy, console sẽ log page text để debug
- Timeout: 10 giây (20 attempts × 500ms)
