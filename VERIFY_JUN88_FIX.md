# Verify JUN88 Bot Detection Fix

## Bước 1: Chạy test script

```bash
node test-jun88-anti-bot.js
```

**Điều gì sẽ xảy ra:**
1. Browser mở (headless: false)
2. Điền form chậm (15-20s)
3. Scroll page
4. Chờ 8-25s
5. Hiển thị form values
6. Giữ browser mở 5 phút

## Bước 2: Kiểm tra logs

### ✅ Logs tốt (anti-bot hoạt động):
```
🤖 JUN88 Form - Anti-bot mode enabled
📝 Filling username...
⏱️  [1] Filling username...
✅ Username filled (testuser1234567890)
⏱️  [2] Filling password...
✅ Password filled
⏱️  [3] Filling name...
✅ Name filled (Test User)
⏱️  [4] Filling email...
✅ Email filled (test@example.com)
⏱️  [5] Filling mobile...
✅ Mobile filled (912345678)
⏱️  [6] Checking agree checkbox...
✅ Agree checkbox checked
⏱️  Total form filling time: 18s
📜 Simulating page scroll...
⏳ Waiting 15s before submit (anti-bot delay)...
🔍 Verifying form values before submit:
Form values: {
  playerid: 'testuser1234567890',
  password: 'Test@12345',
  firstname: 'Test User',
  email: 'test@example.com',
  mobile: '912345678',
  agree: true
}
✅ Anti-bot test completed!
```

### ❌ Logs xấu (anti-bot không hoạt động):
```
📝 Filling username...
✅ Username filled (testuser1234567890)
⏱️  Total form filling time: 1s  ← TOO FAST!
⏳ Waiting 2s before submit...   ← TOO SHORT!
```

## Bước 3: Kiểm tra DevTools

1. Mở DevTools (F12)
2. Xem Console tab
3. Kiểm tra có error gì không

### ✅ Tốt:
- Không có error
- Không có warning về automation

### ❌ Xấu:
- Error: "Automation detected"
- Warning: "Headless browser detected"

## Bước 4: Kiểm tra form values

Trước khi submit, script sẽ hiển thị:
```javascript
Form values: {
  playerid: 'testuser1234567890',
  password: 'Test@12345',
  firstname: 'Test User',
  email: 'test@example.com',
  mobile: '912345678',
  agree: true
}
```

### ✅ Tốt:
- Tất cả fields có giá trị
- agree: true

### ❌ Xấu:
- Có field trống
- agree: false

## Bước 5: Kiểm tra timing

### ✅ Tốt:
```
⏱️  Total form filling time: 18s  ← 15-20s ✓
⏳ Waiting 15s before submit...   ← 8-25s ✓
```

### ❌ Xấu:
```
⏱️  Total form filling time: 1s   ← < 5s ✗
⏳ Waiting 2s before submit...    ← < 5s ✗
```

## Bước 6: Chạy full automation

```bash
node dashboard/server.js
```

1. Vào dashboard
2. Chọn Category: JUN88
3. Chọn Mode: Auto
4. Chọn Sites: Jun881, Jun882
5. Click "Start Automation"

### ✅ Tốt:
- Form được điền chậm
- Có delay trước submit
- Trang không báo lỗi
- User có thể giải captcha
- Đăng kí thành công

### ❌ Xấu:
- Form được điền nhanh
- Không có delay
- Trang báo "Phát hiện bot"
- Đăng kí thất bại

## Bước 7: Kiểm tra code changes

### Verify fillJUN88RegisterForm:
```bash
grep -n "delay: 150" tools/vip-tool/vip-automation.js
```

**Kết quả kỳ vọng:**
```
2087:            await page.type('input[id="playerid"]', profileData.username, { delay: 150 });
2093:            await page.type('input[id="password"]', profileData.password, { delay: 150 });
```

### Verify registerStep JUN88 delays:
```bash
grep -n "isJUN88Category" tools/vip-tool/vip-automation.js
```

**Kết quả kỳ vọng:**
```
622:            const isJUN88Category = ['jun88', '78win', 'jun88v2'].includes(category);
623:            if (isJUN88Category) {
```

### Verify scroll simulation:
```bash
grep -n "window.scrollBy" tools/vip-tool/vip-automation.js
```

**Kết quả kỳ vọng:**
```
625:                await page.evaluate(() => {
626:                    window.scrollBy(0, 200);
```

## Troubleshooting

### Problem: "Cannot find element"
**Solution:**
1. Kiểm tra form selectors có đúng không
2. Xem DevTools xem input ID là gì
3. Update selectors nếu cần

### Problem: "Form filled too fast"
**Solution:**
1. Verify delay: 150ms per character
2. Verify wait time: 800ms after each field
3. Check logs: "Total form filling time"

### Problem: "Still detected as bot"
**Solution:**
1. Tăng delay: 10-30s thay vì 8-25s
2. Thêm random viewport
3. Thêm random user-agent
4. Thử headless: false

### Problem: "Captcha not appearing"
**Solution:**
1. Kiểm tra form submit có thành công không
2. Xem DevTools Network tab
3. Kiểm tra có error response không

## Checklist

- [ ] Test script chạy thành công
- [ ] Logs hiển thị anti-bot measures
- [ ] Form filling time: 15-20s
- [ ] Delay trước submit: 8-25s
- [ ] Form values đúng
- [ ] Không có error trong console
- [ ] Full automation chạy thành công
- [ ] Đăng kí thành công

## Next Steps

Nếu tất cả checklist ✅:
1. Chạy automation cho tất cả Jun88 sites
2. Monitor logs
3. Verify đăng kí thành công

Nếu có ❌:
1. Xem troubleshooting
2. Tăng delay
3. Kiểm tra selectors
4. Chạy test script lại

---

**Last Updated**: 2025-12-18
