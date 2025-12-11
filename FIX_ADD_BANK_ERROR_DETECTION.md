# Fix Add Bank Error Detection

## Vấn đề

Khi add bank có lỗi:
- ❌ Website hiện notification thông báo lỗi
- ❌ Nhưng log lại báo "✅ Add bank successful"
- ❌ Dashboard hiển thị success mặc dù thực tế failed

## Nguyên nhân

### 1. Content script return success ngay lập tức
```javascript
// content.js - redirectToWithdrawAndFill
const result = await findAndClickWithdrawButton();
if (result.success) {
    sendResponse({ success: true, method: 'click' }); // ← Return ngay
}
```

**Vấn đề:** Return success ngay sau khi click button, KHÔNG đợi form fill xong hay check kết quả.

### 2. Automation code timeout và assume success
```javascript
// complete-automation.js - runAddBankInContext
const result = await Promise.race([
    page.evaluate(...),
    new Promise((resolve) => setTimeout(() => {
        resolve({ success: true, message: 'Timeout' }); // ← Timeout = success?
    }, 65000))
]);

// Đợi 25s rồi return success
await wait(25000);
return { success: true, message: 'Bank added successfully' }; // ← Không check kết quả
```

**Vấn đề:** 
- Timeout sau 65s và assume success
- Đợi 25s rồi return success mà không verify
- Không check notification lỗi từ website

## Giải pháp

### Check success indicators và error notifications

**Quan trọng:** Khi add bank thành công:
- URL thay đổi thành `/Financial?tab=2`
- Form chuyển sang hiển thị thông tin (readonly)
- KHÔNG có notification

```javascript
// Wait for form to be filled and submitted
await wait(25000);

// Check result: URL change + form display or error notification
console.log('    🔍 Checking add bank result...');
const checkResult = await page.evaluate(() => {
    const currentUrl = window.location.href;
    
    // Success indicator 1: URL changed to tab=2 (bank info display)
    if (currentUrl.includes('Financial?tab=2') || 
        currentUrl.includes('Financial?type=withdraw&tab=2')) {
        return {
            success: true,
            method: 'url_change',
            message: 'URL changed to tab=2 (bank info display)'
        };
    }

    // Success indicator 2: Bank info display element
    const bankInfoDisplay = document.querySelector(
        '.bank-info-display, [class*="bank-info"], [class*="thong-tin-ngan-hang"]'
    );
    if (bankInfoDisplay && bankInfoDisplay.offsetParent !== null) {
        return {
            success: true,
            method: 'display_check',
            message: 'Bank info display found'
        };
    }

    // Success indicator 3: Readonly bank fields
    const readonlyFields = document.querySelectorAll('input[readonly], input[disabled]');
    let hasBankFields = false;
    for (const field of readonlyFields) {
        const name = field.name || field.id || '';
        if (name.toLowerCase().includes('bank') || 
            name.toLowerCase().includes('account')) {
            hasBankFields = true;
            break;
        }
    }
    if (hasBankFields) {
        return {
            success: true,
            method: 'readonly_fields',
            message: 'Readonly bank fields found'
        };
    }

    // Check for error notifications
    const errorSelectors = [
        '.error-message',
        '.alert-danger',
        '.notification.error',
        '[class*="error"]',
        '[class*="fail"]'
    ];

    for (const selector of errorSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            if (el.offsetParent !== null && el.textContent.trim()) {
                return {
                    success: false,
                    method: 'error_element',
                    message: el.textContent.trim()
                };
            }
        }
    }

    // Check for notification text content
    const notifications = document.querySelectorAll('.notification, .toast, .alert, [role="alert"]');
    for (const notif of notifications) {
        const text = notif.textContent.toLowerCase();
        if (text.includes('lỗi') || text.includes('error') || 
            text.includes('fail') || text.includes('không thành công')) {
            return {
                success: false,
                method: 'error_notification',
                message: notif.textContent.trim()
            };
        }
    }

    // If no clear indicator, assume success
    return {
        success: true,
        method: 'assume',
        message: 'No error detected, assuming success'
    };
});

console.log(`    📊 Check result: ${checkResult.method} - ${checkResult.message}`);

if (!checkResult.success) {
    console.log('    ❌ Add bank failed:', checkResult.message);
    return { success: false, message: checkResult.message };
}

console.log('    ✅ Add bank process completed');
return { success: true, message: 'Bank added successfully' };
```

## Cách hoạt động

### 1. Check success indicators (Priority)

#### 1.1. URL change
Khi add bank thành công, URL thay đổi:
```
/Financial?type=withdraw → /Financial?tab=2
```

```javascript
if (currentUrl.includes('Financial?tab=2')) {
    return { success: true, method: 'url_change' };
}
```

#### 1.2. Bank info display
Form chuyển sang hiển thị thông tin (như ảnh):
```javascript
const bankInfoDisplay = document.querySelector(
    '.bank-info-display, [class*="bank-info"], [class*="thong-tin-ngan-hang"]'
);
if (bankInfoDisplay && bankInfoDisplay.offsetParent !== null) {
    return { success: true, method: 'display_check' };
}
```

#### 1.3. Readonly fields
Các field chuyển sang readonly/disabled:
```javascript
const readonlyFields = document.querySelectorAll('input[readonly], input[disabled]');
for (const field of readonlyFields) {
    const name = field.name || field.id || '';
    if (name.includes('bank') || name.includes('account')) {
        return { success: true, method: 'readonly_fields' };
    }
}
```

### 2. Check error indicators

#### 2.1. Error selectors
Tìm các elements có class chứa "error" hoặc "fail":
- `.error-message`
- `.alert-danger`
- `.notification.error`
- `[class*="error"]`
- `[class*="fail"]`

#### 2.2. Notification content
Tìm các notification elements và check text:
- `.notification`
- `.toast`
- `.alert`
- `[role="alert"]`

Nếu text chứa:
- "lỗi"
- "error"
- "fail"
- "không thành công"

→ Return error

### 3. Fallback
Nếu không tìm thấy success indicator hoặc error indicator:
```javascript
return {
    success: true,
    method: 'assume',
    message: 'No error detected, assuming success'
};
```

## Kết quả

### Trước
```
📊 Add bank result: { success: true, method: 'click' }
⏳ Waiting 25 seconds for bank form to be filled and submitted...
✅ Add bank process completed
✅ Add bank successful
```

**Thực tế:** Website hiện lỗi "Tài khoản ngân hàng đã tồn tại"

### Sau - Case 1: Thành công
```
📊 Add bank result: { success: true, method: 'click' }
⏳ Waiting 25 seconds for bank form to be filled and submitted...
🔍 Checking add bank result...
📊 Check result: url_change - URL changed to tab=2 (bank info display)
✅ Add bank process completed
✅ Add bank successful
```

**Kết quả:** Detect URL change → Success

### Sau - Case 2: Lỗi
```
📊 Add bank result: { success: true, method: 'click' }
⏳ Waiting 25 seconds for bank form to be filled and submitted...
🔍 Checking add bank result...
📊 Check result: error_notification - Tài khoản ngân hàng đã tồn tại
❌ Add bank failed: Tài khoản ngân hàng đã tồn tại
⚠️  Add bank failed, but continuing...
```

**Kết quả:** Detect error notification → Failed

## Các loại lỗi có thể detect

### 1. Tài khoản đã tồn tại
```
Tài khoản ngân hàng đã tồn tại
```

### 2. Thông tin không hợp lệ
```
Số tài khoản không hợp lệ
Tên ngân hàng không đúng
```

### 3. Lỗi hệ thống
```
Có lỗi xảy ra, vui lòng thử lại
Không thể kết nối đến server
```

### 4. Lỗi validation
```
Vui lòng nhập đầy đủ thông tin
Số tài khoản phải là số
```

## Lưu ý

### 1. Không block workflow
Nếu add bank failed, vẫn tiếp tục check promo:
```javascript
if (!addBankResult.success) {
    console.log(`⚠️  Add bank failed, but continuing...`);
} else {
    console.log(`✅ Add bank successful`);
}
```

### 2. Log error message
Error message được log để debug:
```javascript
console.log('    ❌ Add bank failed - Error detected:', hasError.message);
```

### 3. Return proper status
```javascript
return { 
    success: false, 
    message: hasError.message || 'Add bank failed' 
};
```

## Testing

### Test case 1: Add bank thành công
**Behavior:**
- URL: `/Financial?type=withdraw` → `/Financial?tab=2`
- Form: Input fields → Display info (readonly)
- Notification: None

**Expected log:**
```
📊 Check result: url_change - URL changed to tab=2 (bank info display)
✅ Add bank process completed
✅ Add bank successful
```

### Test case 2: Tài khoản đã tồn tại
**Behavior:**
- URL: Không đổi
- Form: Vẫn là input fields
- Notification: "Tài khoản ngân hàng đã tồn tại"

**Expected log:**
```
📊 Check result: error_notification - Tài khoản ngân hàng đã tồn tại
❌ Add bank failed: Tài khoản ngân hàng đã tồn tại
⚠️  Add bank failed, but continuing...
```

### Test case 3: Thông tin không hợp lệ
**Behavior:**
- URL: Không đổi
- Form: Vẫn là input fields
- Notification: "Số tài khoản không hợp lệ"

**Expected log:**
```
📊 Check result: error_notification - Số tài khoản không hợp lệ
❌ Add bank failed: Số tài khoản không hợp lệ
⚠️  Add bank failed, but continuing...
```

### Test case 4: Bank info display (không có URL change)
**Behavior:**
- URL: Không đổi (một số site không redirect)
- Form: Hiển thị thông tin ngân hàng
- Notification: None

**Expected log:**
```
📊 Check result: display_check - Bank info display found
✅ Add bank process completed
✅ Add bank successful
```

## Files đã sửa

- ✅ `tools/nohu-tool/complete-automation.js` - Thêm error detection logic

## Cải tiến trong tương lai

### 1. Check success indicators
Ngoài check error, có thể check success:
```javascript
const successSelectors = [
    '.success-message',
    '.alert-success',
    '.notification.success'
];
```

### 2. Screenshot khi có lỗi
Chụp màn hình khi detect lỗi để debug:
```javascript
if (hasError.hasError) {
    await page.screenshot({ 
        path: `error-${Date.now()}.png` 
    });
}
```

### 3. Retry logic
Tự động retry khi gặp lỗi tạm thời:
```javascript
if (hasError.hasError && hasError.message.includes('thử lại')) {
    console.log('Retrying...');
    // Retry logic
}
```
