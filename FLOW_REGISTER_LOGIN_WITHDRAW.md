# Flow Đăng Ký → Login → Rút Tiền

## Flow mới (đã sửa)

### 1. Đăng ký ở link ref
```
Submit form đăng ký → Giải captcha → Check có token
```

### 2. Redirect sang link app
```
Có token (đăng ký thành công) → Navigate sang loginUrl
```

### 3. Login ở link app
```
Fill form login → Submit → Check token login
```

### 4. Redirect sang trang rút tiền
```
Login thành công → Navigate sang /Financial?type=withdraw
```

### 5. Fill form rút tiền
```
Fill bank info → Submit
```

## Code flow

```javascript
// STEP 1: Register
const result = await actions.completeRegistration(profileData);
if (!result.success) return; // Stop if failed

// STEP 2: Navigate to login URL (ALWAYS)
await page.goto(loginUrl);

// STEP 3: Re-inject scripts
await this.injectScripts(page);

// STEP 4: Auto-login (ALWAYS)
const loginResult = await page.evaluate(() => {
    window._chromeMessageListener({ action: 'autoLogin', data: profileData });
});

if (!loginResult.success) return; // Stop if failed

// STEP 5: Navigate to withdraw URL (if provided)
if (withdrawUrl && bankInfo) {
    await page.goto(withdrawUrl);
    
    // STEP 6: Re-inject scripts
    await this.injectScripts(page);
    
    // STEP 7: Fill withdraw form
    await page.evaluate(() => {
        window._chromeMessageListener({ 
            action: 'fillWithdrawForm', 
            data: { withdrawInfo: bankInfo } 
        });
    });
}
```

## Thay đổi chính

### Trước đây
- Check "already logged in" → Skip login nếu có token
- Gây lỗi vì không login vào link app

### Bây giờ
- **LUÔN LUÔN** navigate sang loginUrl
- **LUÔN LUÔN** submit form login
- Đảm bảo đăng nhập đúng vào link app

## Lợi ích

1. ✅ Đơn giản - không cần check "already logged in"
2. ✅ Đáng tin cậy - luôn login vào link app
3. ✅ Tự động - từ đăng ký đến rút tiền không cần thao tác
4. ✅ Nhanh - fill form bằng set value trực tiếp

## Files đã sửa

1. ✅ `dashboard/tools-ui/nohu-tool.html` - Thêm withdrawUrl vào data
2. ✅ `tools/nohu-tool/complete-automation.js` - Bỏ logic "already logged in", luôn login
3. ✅ `tools/nohu-tool/auto-sequence.js` - Truyền withdrawUrl vào runRegistration

## Test

Chạy tool → Chọn sites → Start

Tool sẽ tự động:
1. Đăng ký ở link ref ✅
2. Chuyển sang link app ✅
3. **Login vào link app** ✅ (MỚI - luôn luôn login)
4. Chuyển sang trang rút tiền ✅
5. Fill form rút tiền ✅

Tất cả tự động! 🚀
