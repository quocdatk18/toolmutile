# VIP Tool - Token Check Logic

## Vấn Đề
VIP Tool chưa check token trước khi redirect sau khi submit form. Điều này có thể gây lỗi nếu server chưa cấp token.

## Giải Pháp
Thêm logic check token trước khi redirect, tương tự NOHU Tool:

```javascript
// Check token trước khi redirect
let hasToken = false;
let waitAttempts = 0;
const maxWaitAttempts = 10; // Max 5 giây

while (waitAttempts < maxWaitAttempts) {
    waitAttempts++;
    
    try {
        const status = await page.evaluate(() => {
            const cookies = document.cookie;
            const hasToken = cookies.includes('_pat=') ||
                cookies.includes('token=') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth');
            
            return { hasToken: !!hasToken };
        });
        
        hasToken = status.hasToken;
        
        if (hasToken) {
            console.log(`✅ Token found after ${waitAttempts * 500}ms`);
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
        console.log(`⚠️ Token check failed:`, e.message);
    }
}

// Redirect sau khi có token hoặc timeout
await page.waitForNavigation({ timeout: 15000 });
```

## Các Bước Được Cập Nhật

1. **registerStep()**: Check token sau khi submit form
2. **addBankOKVIP()**: Check token sau khi submit bank form
3. **addBankKJC()**: Check token sau khi submit bank form

## Token Được Check

- Cookies: `_pat=`, `token=`
- LocalStorage: `token`, `auth`

## Retry Logic

- Tối đa 10 lần
- Delay 500ms mỗi lần
- Tổng timeout: 5 giây
- Nếu timeout → vẫn redirect (fallback)

## Lợi Ích

- Đảm bảo token được cấp trước khi redirect
- Tránh lỗi 401/403 khi truy cập trang tiếp theo
- Tương tự NOHU Tool (proven working)
