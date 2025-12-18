# JUN88 Quick Test Guide

## What Changed
Tool giờ **không cố gắng auto-solve captcha** cho JUN88. Thay vào đó:
- Tool fill form → submit → chờ user giải captcha thủ công
- Khi user giải xong → tool detect token → redirect to addbank tự động

## How to Test

### Step 1: Start Automation
```
Category: JUN88
Site: Jun881
Profile: tele 3
Mode: auto
```

### Step 2: Watch the Logs
Bạn sẽ thấy:
```
⏭️ Skipping auto-captcha for jun88 (manual captcha required)
📝 Fill form...
📤 Submitting registration form...
📝 Manual captcha mode: Waiting up to 120s for user to solve captcha...
⏳ [1/240] Waiting for manual captcha (0s)...
⏳ [2/240] Waiting for manual captcha (1s)...
...
```

### Step 3: Solve Captcha in Browser
- Hidemium browser sẽ mở trang JUN88
- Captcha sẽ hiện lên
- **Bạn giải captcha thủ công** (vẽ ký tự)
- Form auto-submit sau khi giải

### Step 4: Tool Detects Token
Khi form submit thành công:
```
✅ Token found after 2500ms
✅ Token acquired, register successful
⏳ Waiting 5s before redirect to addbank...
🔄 Redirecting to addbank page for jun88...
```

### Step 5: Fill Bank Info
Tool tự động:
- Click bank dropdown
- Select bank
- Fill account number
- Fill password
- Submit

## Expected Timeline

| Step | Time | Action |
|------|------|--------|
| Fill form | 3s | Tool fill fields |
| Wait before submit | 5-20s | Random delay |
| Submit | 1s | Click button |
| Wait after submit | 3s | Buffer |
| **User solves captcha** | **30-60s** | **Manual** |
| Detect token | <1s | Tool check |
| Wait before redirect | 2-10s | Random delay |
| Redirect to addbank | 1s | Navigate |
| Fill bank info | 5-10s | Tool fill |
| Submit bank | 1s | Click button |
| **Total** | **~2-3 min** | **Depends on user** |

## Troubleshooting

### Captcha không hiện
- Check Hidemium browser có mở không
- Check URL có đúng không: `https://sasa2.xn--8866-um1g.com/signup`

### Tool không detect token
- Kiểm tra form submit có thành công không
- Xem browser console có error không
- Thử giải captcha lại

### Timeout (120s)
- Nếu tool timeout → register failed
- Thử lại, có thể captcha quá khó

## Next Steps

Sau khi JUN88 hoàn tất:
1. Test 78WIN (Form 2 - no email)
2. Test JUN88V2 (Form 3 - fullname, username, password, phone)
3. Implement addBank logic cho 2 form này (copy từ JUN88)
