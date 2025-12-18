# JUN88 Captcha Handling Fix

## Problem
- Autocaptcha.pro API không thể giải captcha của JUN88
- Tool cần chờ user giải captcha thủ công thay vì cố gắng auto-solve

## Solution
Updated `registerStep()` function to skip auto-captcha injection for manual captcha categories (jun88, 78win, jun88v2):

### Changes Made

1. **Skip Auto-Captcha Injection** (Line ~603)
   - Kiểm tra nếu category là manual captcha (jun88, 78win, jun88v2)
   - Nếu có → skip script injection, log "Skipping auto-captcha"
   - Nếu không → inject scripts như bình thường (OKVIP, ABCVIP)

2. **Improved Token Checking** (Line ~655)
   - Thêm biến `isManualCaptcha` để dễ theo dõi
   - Log rõ ràng: "Manual captcha mode: Waiting up to 120s for user to solve captcha..."
   - Kiểm tra token ngay sau khi submit (không chờ 120s)
   - Nếu token found → proceed to addbank
   - Nếu không → tiếp tục check mỗi 500ms trong 120s

3. **Clear Logging**
   - Mỗi 500ms log: `[attempt/max] Waiting for manual captcha (Xs)...`
   - User có thể thấy tool đang chờ và bao lâu nữa timeout

## Flow for JUN88/78WIN/JUN88V2

```
1. Fill form (playerid, password, firstname, email, mobile)
   ↓
2. Wait 5-20s random delay
   ↓
3. Submit form (button[type="button"] with "ĐĂNG KÝ" text)
   ↓
4. Wait 3s
   ↓
5. Check for token immediately
   ├─ If token found → Go to step 6
   └─ If no token → Wait up to 120s, check every 500ms
   ↓
6. Wait 2-10s random delay
   ↓
7. Redirect to addbank page
   ↓
8. Fill bank info (bank dropdown, account, password)
   ↓
9. Submit bank form
```

## Key Points

- **No auto-captcha**: Tool không cố gắng giải captcha tự động
- **User solves manually**: User giải captcha trong browser (120s timeout)
- **Immediate token check**: Sau khi user submit form, tool check token ngay (không chờ)
- **Consistent delays**: Sử dụng `getRandomDelay(2000, 10000)` cho tất cả delays

## Testing

Để test:
1. Chạy automation cho JUN88
2. Xem log: "Skipping auto-captcha for jun88 (manual captcha required)"
3. Xem log: "Manual captcha mode: Waiting up to 120s for user to solve captcha..."
4. Giải captcha trong browser
5. Tool sẽ detect token và redirect to addbank tự động

## Files Modified
- `tools/vip-tool/vip-automation.js` - registerStep() function
