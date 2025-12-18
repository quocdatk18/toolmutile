# Manual Captcha Implementation Details

## Overview
JUN88, 78WIN, và JUN88V2 sử dụng captcha mà autocaptcha.pro không thể giải. Solution là để user giải thủ công trong browser, tool chỉ cần chờ và detect token.

## Implementation

### 1. Skip Auto-Captcha Injection
```javascript
const manualCaptchaCategories = ['jun88', '78win', 'jun88v2'];
if (!manualCaptchaCategories.includes(category)) {
    // Inject captcha-solver script
    await this.injectScripts(page);
} else {
    console.log(`⏭️ Skipping auto-captcha for ${category} (manual captcha required)`);
}
```

**Lý do**: Không cần inject captcha-solver vì user sẽ giải thủ công

### 2. Token Detection Logic
```javascript
const isManualCaptcha = manualCaptchaCategories.includes(category);
const maxWaitTime = isManualCaptcha ? 120000 : 10000; // 120s vs 10s
const checkInterval = 500; // Check every 500ms

while (waitAttempts < maxWaitAttempts) {
    const status = await page.evaluate(() => {
        const cookies = document.cookie;
        const hasToken = cookies.includes('_pat=') ||
                        cookies.includes('_prt=') ||
                        cookies.includes('token=') ||
                        localStorage.getItem('token') ||
                        localStorage.getItem('auth');
        return { hasToken: !!hasToken, currentUrl: window.location.href };
    });
    
    if (status.hasToken) {
        console.log(`✅ Token found after ${waitAttempts * checkInterval}ms`);
        break;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
}
```

**Lý do**: 
- Check token ngay sau submit (không chờ 120s)
- Nếu user giải captcha nhanh → token sẽ có sớm
- Nếu user chậm → tool chờ tối đa 120s

### 3. Token Sources
Tool check nhiều nơi để tìm token:
- `document.cookie` - Cookies (most common)
- `localStorage.getItem('token')` - Local storage
- `localStorage.getItem('auth')` - Auth token

**Lý do**: Các site khác nhau lưu token ở chỗ khác nhau

### 4. Redirect to AddBank
```javascript
if (isManualCaptcha) {
    const delayBeforeBank = this.getRandomDelay(2000, 10000);
    console.log(`⏳ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect...`);
    await new Promise(r => setTimeout(r, delayBeforeBank));
    
    const domain = this.getDomain(siteConfig.registerUrl);
    const bankPath = this.categoryPaths[category]?.bank;
    const bankUrl = domain + bankPath;
    await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
}
```

**Lý do**:
- Random delay tránh detection
- Redirect tới addbank page sau khi token acquired

## Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ registerStep(browser, category, siteConfig, profileData) │
└─────────────────────────────────────────────────────────┘
                          ↓
                  ┌───────────────┐
                  │ Navigate to   │
                  │ register URL  │
                  └───────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │ Check if manual captcha category?   │
        └─────────────────────────────────────┘
                  ↙                    ↘
            YES (jun88)            NO (okvip)
                  ↓                    ↓
        ┌──────────────────┐  ┌──────────────────┐
        │ Skip injection   │  │ Inject scripts   │
        │ (no auto-solve)  │  │ (auto-solve)     │
        └──────────────────┘  └──────────────────┘
                  ↓                    ↓
        ┌─────────────────────────────────────┐
        │ Fill form fields                    │
        │ (playerid, password, etc.)          │
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │ Wait 5-20s random delay             │
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │ Submit form                         │
        │ (button[type="button"] with "ĐĂNG KÝ")
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │ Wait 3s after submit                │
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │ Check for token immediately         │
        │ (not wait 120s first)               │
        └─────────────────────────────────────┘
                  ↙                    ↘
            Token found          No token yet
                  ↓                    ↓
        ┌──────────────────┐  ┌──────────────────┐
        │ Proceed to       │  │ Wait up to 120s  │
        │ addbank          │  │ Check every 500ms│
        │ (user solved)    │  │ (user solving)   │
        └──────────────────┘  └──────────────────┘
                  ↓                    ↓
                  └────────┬───────────┘
                           ↓
        ┌─────────────────────────────────────┐
        │ Wait 2-10s random delay             │
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │ Redirect to addbank page            │
        │ (domain + /account/withdrawaccounts)│
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │ Return { success: true, page }      │
        └─────────────────────────────────────┘
```

## Comparison: Auto vs Manual Captcha

| Aspect | Auto (OKVIP) | Manual (JUN88) |
|--------|--------------|----------------|
| Inject scripts | ✅ Yes | ❌ No |
| Auto-solve | ✅ Yes | ❌ No |
| User action | ❌ None | ✅ Solve captcha |
| Max wait time | 10s | 120s |
| Check interval | 500ms | 500ms |
| Token check | Immediate | Immediate |
| Redirect delay | 2-10s | 2-10s |

## Error Handling

### Timeout (120s passed, no token)
```javascript
if (!hasToken) {
    console.error(`❌ Token not found after 120s - Register FAILED`);
    return { success: false, error: 'Token not found and no redirect' };
}
```

### Token check error
```javascript
try {
    const status = await page.evaluate(() => { ... });
} catch (e) {
    console.log(`⚠️ Token check failed:`, e.message);
    // Continue checking
}
```

## Future Improvements

1. **Better token detection**: Check more token sources
2. **Captcha image detection**: Detect when captcha appears/disappears
3. **User notification**: Show popup when waiting for captcha
4. **Timeout customization**: Allow user to set custom timeout
5. **Retry logic**: Retry if token check fails

## Testing Checklist

- [ ] Form fills correctly (playerid, password, firstname, email, mobile)
- [ ] Form submits (button with "ĐĂNG KÝ" text)
- [ ] Captcha appears in browser
- [ ] Tool waits for user to solve
- [ ] Tool detects token after solve
- [ ] Tool redirects to addbank
- [ ] Bank form fills correctly
- [ ] Bank form submits
- [ ] Account info saved to `accounts/vip/jun88/YYYY-MM-DD/username/`
